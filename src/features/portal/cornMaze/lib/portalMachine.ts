import { OFFLINE_FARM } from "features/game/lib/landData";
import { GameState } from "features/game/types/game";
import { assign, createMachine, Interpreter, State } from "xstate";
import { getJwt, getUrl, loadPortal } from "../../actions/loadPortal";
import { CONFIG } from "lib/config";
import { decodeToken } from "features/auth/actions/login";
import { startAttempt, submitScore } from "../../lib/portalUtil";

export const MAZE_TIME_LIMIT_SECONDS = 3 * 60;
export const DEFAULT_HEALTH = 3;
// Every map has exactly 25 crows in its `Crows` tile layer. Collecting them
// all is a perfect run and ends the attempt immediately.
export const TOTAL_CROWS = 25;

export interface Context {
  id: number;
  jwt: string;
  state: GameState | undefined;

  score: number;
  health: number;
  crowIds: string[];
  startedAt: number;
  timeElapsed: number;
  // When the run is paused for an early-exit confirmation, the timestamp the
  // pause began. Used to shift `startedAt` by the pause duration on resume so
  // the elapsed timer keeps the player's true play time.
  pausedAt?: number;

  // When set, overrides the daily maze rotation. Used by the beta map-selector
  // (gated behind the CORN_MAZE_MAP_SELECTOR_BETA flag) so testers can pick a
  // specific layout. Undefined = use getCurrentMazeDay().
  selectedDay?: number;
}

export type PortalEvent =
  | { type: "SCENE_LOADED" }
  | { type: "START" }
  | { type: "HIT_ENEMY" }
  | { type: "COLLECT_CROW"; crowId: string }
  | { type: "PORTAL_HIT" }
  | { type: "CONFIRM_EXIT" }
  | { type: "CANCEL_EXIT" }
  | { type: "TICK" }
  | { type: "RETRY" }
  | { type: "PURCHASED" }
  | { type: "SELECT_DAY"; day: number | undefined };

export type PortalState = {
  value:
    | "initialising"
    | "error"
    | "unauthorised"
    | "loading"
    | "ready"
    | "playing"
    | "confirmingExit"
    | "gameover";
  context: Context;
};

export type MachineInterpreter = Interpreter<
  Context,
  any,
  PortalEvent,
  PortalState
>;

export type PortalMachineState = State<Context, PortalEvent, PortalState>;

const resetAttempt = assign<Context, PortalEvent>({
  score: (_) => 0,
  health: (_) => DEFAULT_HEALTH,
  crowIds: (_) => [],
  startedAt: (_) => 0,
  timeElapsed: (_) => 0,
});

export const portalMachine = createMachine<Context, PortalEvent, PortalState>({
  id: "cornMazePortal",
  initial: "initialising",
  preserveActionOrder: true,
  context: {
    id: 0,
    jwt: getJwt(),
    state: CONFIG.API_URL ? undefined : OFFLINE_FARM,
    score: 0,
    health: DEFAULT_HEALTH,
    crowIds: [],
    startedAt: 0,
    timeElapsed: 0,
  },
  states: {
    initialising: {
      always: [
        {
          target: "unauthorised",
          // Only gate on auth when embedded in the parent game (production iframe).
          // Standalone dev runs (localhost, no iframe) skip straight to loading
          // and the offline farm so devs can play the maze without a JWT.
          cond: (context) =>
            !!CONFIG.API_URL && !context.jwt && window.self !== window.top,
        },
        { target: "loading" },
      ],
    },

    loading: {
      invoke: {
        src: async (context) => {
          if (!getUrl()) {
            return { game: OFFLINE_FARM };
          }

          const { farmId } = decodeToken(context.jwt as string);

          const { game } = await loadPortal({
            portalId: CONFIG.PORTAL_APP,
            token: context.jwt as string,
          });

          return { game, farmId };
        },
        onDone: {
          target: "ready",
          actions: assign<Context, any>({
            state: (_: any, event) => event.data.game,
            id: (_: any, event) => event.data.farmId ?? 0,
          }),
        },
        onError: { target: "error" },
      },
    },

    ready: {
      // Waits for the player to dismiss the tips modal in the HUD.
      on: {
        START: {
          target: "playing",
          actions: [
            resetAttempt,
            assign({ startedAt: (_) => Date.now() }),
            () => startAttempt(),
          ],
        },
        SELECT_DAY: {
          actions: assign({
            selectedDay: (_, event) =>
              event.type === "SELECT_DAY" ? event.day : undefined,
          }),
        },
      },
    },

    playing: {
      invoke: {
        src: () => (cb) => {
          const interval = setInterval(() => cb("TICK"), 1000);
          return () => clearInterval(interval);
        },
      },
      always: [
        {
          target: "gameover",
          cond: (context) =>
            context.health <= 0 ||
            context.timeElapsed >= MAZE_TIME_LIMIT_SECONDS ||
            context.score >= TOTAL_CROWS,
        },
      ],
      on: {
        TICK: {
          actions: assign<Context, any>({
            timeElapsed: (context) =>
              Math.max(0, Math.floor((Date.now() - context.startedAt) / 1000)),
          }),
        },
        COLLECT_CROW: {
          actions: assign({
            score: (context) => context.score + 1,
            crowIds: (context, event) =>
              event.type === "COLLECT_CROW"
                ? [...context.crowIds, event.crowId]
                : context.crowIds,
          }),
        },
        HIT_ENEMY: {
          actions: assign({
            health: (context) => Math.max(0, context.health - 1),
          }),
        },
        // Touching Luna while time and lives remain pops a confirmation modal
        // rather than ending the run outright. Auto-game-over conditions
        // (timer / lives / all crows) take precedence via the `always` block
        // above and run before this event would be processed.
        PORTAL_HIT: { target: "confirmingExit" },
      },
    },

    confirmingExit: {
      entry: assign<Context, PortalEvent>({ pausedAt: (_) => Date.now() }),
      on: {
        CONFIRM_EXIT: { target: "gameover" },
        CANCEL_EXIT: {
          target: "playing",
          // Shift `startedAt` forward by the pause duration so `timeElapsed`
          // stays accurate to actual play time when the run resumes.
          actions: assign<Context, PortalEvent>({
            startedAt: (context) =>
              context.startedAt +
              (Date.now() - (context.pausedAt ?? Date.now())),
            pausedAt: (_) => undefined,
          }),
        },
      },
    },

    gameover: {
      entry: (context) => submitScore({ score: context.score }),
      on: {
        RETRY: { target: "ready" },
      },
    },

    error: {
      on: { RETRY: { target: "initialising" } },
    },

    unauthorised: {},
  },
});
