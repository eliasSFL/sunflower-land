import React, { useContext } from "react";
import { useSelector } from "@xstate/react";

import { HudContainer } from "components/ui/HudContainer";
import { Label } from "components/ui/Label";
import { SquareIcon } from "components/ui/SquareIcon";
import { Button } from "components/ui/Button";
import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { SUNNYSIDE } from "assets/sunnyside";
import crowIcon from "assets/decorations/crow_without_shadow.png";
import { NPC_WEARABLES } from "lib/npcs";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { goHome } from "../../lib/portalUtil";

import { PortalContext } from "../lib/PortalProvider";
import {
  DEFAULT_HEALTH,
  MAZE_TIME_LIMIT_SECONDS,
  PortalMachineState,
} from "../lib/portalMachine";
import { TimerDisplay } from "./TimerDisplay";

const _score = (state: PortalMachineState) => state.context.score;
const _health = (state: PortalMachineState) => state.context.health;
const _startedAt = (state: PortalMachineState) => state.context.startedAt;
const _timeElapsed = (state: PortalMachineState) => state.context.timeElapsed;
const _ready = (state: PortalMachineState) => state.matches("ready");
const _playing = (state: PortalMachineState) => state.matches("playing");
const _won = (state: PortalMachineState) => state.matches("won");
const _lost = (state: PortalMachineState) => state.matches("lost");

export const CornMazeHUD: React.FC = () => {
  const { portalService } = useContext(PortalContext);

  const score = useSelector(portalService, _score);
  const health = useSelector(portalService, _health);
  const startedAt = useSelector(portalService, _startedAt);
  const timeElapsed = useSelector(portalService, _timeElapsed);
  const ready = useSelector(portalService, _ready);
  const playing = useSelector(portalService, _playing);
  const won = useSelector(portalService, _won);
  const lost = useSelector(portalService, _lost);

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
        {(playing || won || lost) && (
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
        {(playing || won || lost) && (
          <TimerDisplay startedAt={startedAt} timeLeft={timeLeft} />
        )}
      </HudContainer>

      {/* Tips / ready modal */}
      <Modal show={ready}>
        <Panel
          bumpkinParts={{
            ...NPC_WEARABLES.luna,
            body: "Light Brown Worried Farmer Potion",
          }}
        >
          <div className="p-1 space-y-2 mb-2 flex flex-col text-xs">
            <p>{"Welcome to my corn maze, brave adventurer!"}</p>
            <p>
              {
                "Collect as many crows as you can before the timer runs out. Watch out for the wandering enemies — they'll cost you a life and some time."
              }
            </p>
            <p>
              {"Touch me at the portal to end your run and submit your score."}
            </p>
          </div>
          <Button onClick={() => portalService.send("START")}>
            {"Let's go!"}
          </Button>
        </Panel>
      </Modal>

      {/* Winning modal */}
      <Modal show={won}>
        <Panel bumpkinParts={NPC_WEARABLES.luna}>
          <div className="p-1 space-y-2 mb-2 flex flex-col text-xs">
            <p>{"Ah, you've returned! Well played, adventurer."}</p>
            <p>{`You collected ${score} ${score === 1 ? "crow" : "crows"}.`}</p>
          </div>
          <div className="flex gap-1">
            <Button onClick={() => portalService.send("RETRY")}>
              {"Play again"}
            </Button>
            <Button onClick={goHome}>{"Home"}</Button>
          </div>
        </Panel>
      </Modal>

      {/* Losing modal */}
      <Modal show={lost}>
        <Panel
          bumpkinParts={{
            ...NPC_WEARABLES.luna,
            body: "Light Brown Worried Farmer Potion",
          }}
        >
          <div className="p-1 space-y-2 mb-2 flex flex-col text-xs">
            <p>
              {timeLeft === 0
                ? "Oh no, time's up! My poor crows are still lost."
                : "Oh no, you've been outwitted by the cunning enemies!"}
            </p>
            <p>{`You collected ${score} ${score === 1 ? "crow" : "crows"}.`}</p>
          </div>
          <div className="flex gap-1">
            <Button onClick={() => portalService.send("RETRY")}>
              {"Try again"}
            </Button>
            <Button onClick={goHome}>{"Home"}</Button>
          </div>
        </Panel>
      </Modal>
    </>
  );
};
