import React, { useContext, useState } from "react";
import { useSelector } from "@xstate/react";

import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { DropdownPanel } from "components/ui/DropdownPanel";
import { SUNNYSIDE } from "assets/sunnyside";
import { PIXEL_SCALE } from "features/game/lib/constants";

import { goHome } from "features/portal/lib/portalUtil";
import { hasFeatureAccess } from "lib/flags";
import { PortalContext } from "../../lib/PortalProvider";
import { PortalMachineState, TOTAL_CROWS } from "../../lib/portalMachine";
import { TOTAL_MAZE_DAYS, getCurrentMazeDay } from "../../lib/mazes";
import { CornMazeNavigationButtons } from "./CornMazeNavigationButtons";
import { CornMazeMailbox } from "./CornMazeMailbox";
import { CornMazeMissions } from "./CornMazeMissions";
import { CornMazeGuide } from "./CornMazeGuide";

export type CornMazePage = "main" | "mailbox" | "missions" | "guide";

const _state = (state: PortalMachineState) => state.context.state;
const _minigame = (state: PortalMachineState) =>
  state.context.state?.minigames.games["corn-maze"];
const _score = (state: PortalMachineState) => state.context.score;
const _selectedDay = (state: PortalMachineState) => state.context.selectedDay;

interface Props {
  mode: "introduction" | "success" | "failed";
  showScore: boolean;
  showExitButton: boolean;
  confirmButtonText: string;
  onConfirm: () => void;
}

export const CornMazeHome: React.FC<Props> = ({
  mode,
  showScore,
  showExitButton,
  confirmButtonText,
  onConfirm,
}) => {
  const { portalService } = useContext(PortalContext);

  const state = useSelector(portalService, _state);
  const minigame = useSelector(portalService, _minigame);
  const score = useSelector(portalService, _score);
  const selectedDay = useSelector(portalService, _selectedDay);

  const showMapSelector =
    mode === "introduction" &&
    !!state &&
    hasFeatureAccess(state, "CORN_MAZE_MAP_SELECTOR_BETA");

  const todayKey = new Date().toISOString().slice(0, 10);
  const personalHighscore = minigame?.highscore ?? 0;
  const dailyHighscore = minigame?.history?.[todayKey]?.highscore ?? 0;

  // Don't render the scores panel until we actually have farm state — avoids
  // a flash of "0 / 0 / 0" while loading.
  const hasState = !!state;

  const [page, setPage] = useState<CornMazePage>("main");
  const back = () => setPage("main");

  if (page === "mailbox") return <CornMazeMailbox onBack={back} />;
  if (page === "missions") return <CornMazeMissions onBack={back} />;
  if (page === "guide") return <CornMazeGuide onBack={back} />;

  return (
    <div className="flex flex-col gap-1 max-h-[75vh]">
      <div className="flex flex-col gap-1 overflow-x-hidden overflow-y-auto scrollable px-1">
        {/* Header label changes shape based on mode. */}
        <div className="flex justify-center mb-1 py-1 pl-1">
          {mode === "introduction" && (
            <Label type="default" className="text-center">
              {"Corn Maze"}
            </Label>
          )}
          {mode === "success" && (
            <Label
              type="success"
              className="text-center"
              icon={SUNNYSIDE.icons.confirm}
            >
              {"Perfect run!"}
            </Label>
          )}
          {mode === "failed" && (
            <Label
              type="danger"
              className="text-center"
              icon={SUNNYSIDE.icons.death}
            >
              {"Run over"}
            </Label>
          )}
        </div>

        {/* Navigation buttons (mailbox / missions / guide). */}
        <div className="mb-2">
          <CornMazeNavigationButtons setPage={setPage} />
        </div>

        {/* Beta map selector — gated on CORN_MAZE_MAP_SELECTOR_BETA. Replaces
         * the daily rotation while on; "auto" resets to the rotation. */}
        {showMapSelector && (
          <div className="mb-2 flex flex-col gap-1 px-1">
            <Label type="warning" icon={SUNNYSIDE.icons.expression_alerted}>
              {"Map (beta)"}
            </Label>
            <DropdownPanel<string>
              value={selectedDay !== undefined ? String(selectedDay) : "auto"}
              onChange={(value) =>
                portalService.send("SELECT_DAY", {
                  day: value === "auto" ? undefined : Number(value),
                })
              }
              options={[
                {
                  value: "auto",
                  label: `Today's map (Day ${getCurrentMazeDay()})`,
                },
                ...Array.from({ length: TOTAL_MAZE_DAYS }, (_, i) => i + 1).map(
                  (day) => ({
                    value: String(day),
                    label: `Day ${day}`,
                  }),
                ),
              ]}
            />
          </div>
        )}

        {/* Scores panel. */}
        {hasState && (
          <Label
            type="chill"
            className="flex flex-col gap-4 items-center p-1 !w-full"
            style={{ marginBottom: `${PIXEL_SCALE * 1}px` }}
          >
            {showScore && (
              <div className="flex flex-col items-center w-full">
                <span className="text-sm text-center">{"Score"}</span>
                <span className="text-2xl text-center">{`${score} / ${TOTAL_CROWS}`}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 w-full">
              <div className="flex flex-col items-center w-1/2">
                <span className="text-xs text-center">{"Today's best"}</span>
                <span className="text-sm text-center">{dailyHighscore}</span>
              </div>
              <div className="flex flex-col items-center w-1/2">
                <span className="text-xs text-center">{"Personal best"}</span>
                <span className="text-sm text-center">{personalHighscore}</span>
              </div>
            </div>
          </Label>
        )}
      </div>

      {/* Action buttons. */}
      <div className="flex gap-1">
        {showExitButton && <Button onClick={goHome}>{"Exit"}</Button>}
        <Button onClick={onConfirm}>{confirmButtonText}</Button>
      </div>
    </div>
  );
};
