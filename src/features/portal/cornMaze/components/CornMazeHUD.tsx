import React, { useContext } from "react";
import { useSelector } from "@xstate/react";

import { HudContainer } from "components/ui/HudContainer";
import { Label } from "components/ui/Label";
import { SquareIcon } from "components/ui/SquareIcon";
import { Modal } from "components/ui/Modal";
import { ConfirmationModal } from "components/ui/ConfirmationModal";
import { SUNNYSIDE } from "assets/sunnyside";
import crowIcon from "assets/decorations/crow_without_shadow.png";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { goHome } from "../../lib/portalUtil";

import { PortalContext } from "../lib/PortalProvider";
import {
  DEFAULT_HEALTH,
  MAZE_TIME_LIMIT_SECONDS,
  PortalMachineState,
  TOTAL_CROWS,
} from "../lib/portalMachine";
import { TimerDisplay } from "./TimerDisplay";
import { CornMazeRulesPanel } from "./panel/CornMazeRulesPanel";

const _score = (state: PortalMachineState) => state.context.score;
const _health = (state: PortalMachineState) => state.context.health;
const _timeElapsed = (state: PortalMachineState) => state.context.timeElapsed;
const _ready = (state: PortalMachineState) => state.matches("ready");
const _playing = (state: PortalMachineState) => state.matches("playing");
const _gameover = (state: PortalMachineState) => state.matches("gameover");
const _confirmingExit = (state: PortalMachineState) =>
  state.matches("confirmingExit");

export const CornMazeHUD: React.FC = () => {
  const { portalService } = useContext(PortalContext);

  const score = useSelector(portalService, _score);
  const health = useSelector(portalService, _health);
  const timeElapsed = useSelector(portalService, _timeElapsed);
  const ready = useSelector(portalService, _ready);
  const playing = useSelector(portalService, _playing);
  const gameover = useSelector(portalService, _gameover);
  const confirmingExit = useSelector(portalService, _confirmingExit);

  const timeLeft = Math.max(0, MAZE_TIME_LIMIT_SECONDS - timeElapsed);

  return (
    <>
      <HudContainer>
        {/* Health hearts — top-left */}
        <div
          className="absolute flex"
          style={{
            left: `${PIXEL_SCALE * 3}px`,
            top: `${PIXEL_SCALE * 3}px`,
            gap: `${PIXEL_SCALE * 1}px`,
          }}
        >
          {new Array(DEFAULT_HEALTH).fill(null).map((_, i) => (
            <img
              key={i}
              src={SUNNYSIDE.icons.heart}
              style={{
                width: `${PIXEL_SCALE * 11}px`,
                opacity: i < health ? 1 : 0.25,
              }}
            />
          ))}
        </div>

        {/* Score — top-centre */}
        {(playing || gameover) && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: `${PIXEL_SCALE * 3}px` }}
          >
            <Label type="default">
              <div className="flex items-center">
                <SquareIcon icon={crowIcon} width={7} />
                <span className="ml-1">{score}</span>
              </div>
            </Label>
          </div>
        )}

        {/* Home button — bottom-left */}
        <div
          className="fixed z-50 flex flex-col justify-between"
          style={{
            left: `${PIXEL_SCALE * 3}px`,
            bottom: `${PIXEL_SCALE * 3}px`,
            width: `${PIXEL_SCALE * 22}px`,
          }}
        >
          <div
            className="flex relative z-50 justify-center cursor-pointer hover:img-highlight group"
            style={{
              width: `${PIXEL_SCALE * 22}px`,
              height: `${PIXEL_SCALE * 23}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              goHome();
            }}
          >
            <img
              src={SUNNYSIDE.ui.round_button_pressed}
              className="absolute"
              style={{ width: `${PIXEL_SCALE * 22}px` }}
            />
            <img
              src={SUNNYSIDE.ui.round_button}
              className="absolute group-active:translate-y-[2px]"
              style={{ width: `${PIXEL_SCALE * 22}px` }}
            />
            <img
              src={SUNNYSIDE.icons.worldIcon}
              className="absolute group-active:translate-y-[2px]"
              style={{
                width: `${PIXEL_SCALE * 12}px`,
                left: `${PIXEL_SCALE * 5}px`,
                top: `${PIXEL_SCALE * 4}px`,
              }}
            />
          </div>
        </div>

        {/* Timer — bottom-right, only while actively running */}
        {(playing || gameover) && <TimerDisplay timeLeft={timeLeft} />}
      </HudContainer>

      {/* Intro / tips modal */}
      <Modal show={ready}>
        <CornMazeRulesPanel
          mode="introduction"
          showScore={false}
          showExitButton
          confirmButtonText="Let's go!"
          onConfirm={() => portalService.send("START")}
        />
      </Modal>

      {/* Game over — same panel, mode toggles based on whether all crows were collected. */}
      <Modal show={gameover}>
        <CornMazeRulesPanel
          mode={score >= TOTAL_CROWS ? "success" : "failed"}
          showScore
          showExitButton
          confirmButtonText="Play again"
          onConfirm={() => portalService.send("RETRY")}
        />
      </Modal>

      {/* Early-exit confirmation — fires when the player touches Luna while
       *  they still have time and lives left. Auto-game-over conditions
       *  (timer / lives / all crows) bypass this and end the run directly. */}
      <ConfirmationModal
        show={confirmingExit}
        onHide={() => portalService.send("CANCEL_EXIT")}
        messages={[
          "Leave the maze early?",
          `You'll lock in your score of ${score} ${
            score === 1 ? "crow" : "crows"
          }.`,
        ]}
        confirmButtonLabel="Leave"
        onCancel={() => portalService.send("CANCEL_EXIT")}
        onConfirm={() => portalService.send("CONFIRM_EXIT")}
      />
    </>
  );
};
