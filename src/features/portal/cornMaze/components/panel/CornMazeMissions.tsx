import React, { useContext } from "react";
import { useSelector } from "@xstate/react";

import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import { MinigamePrizeUI } from "features/world/ui/portals/MinigamePrizeUI";

import { PortalContext } from "../../lib/PortalProvider";
import { PortalMachineState } from "../../lib/portalMachine";

const _minigame = (state: PortalMachineState) =>
  state.context.state?.minigames.games["corn-maze"];
const _prize = (state: PortalMachineState) =>
  state.context.state?.minigames.prizes["corn-maze"];

interface Props {
  onBack: () => void;
}

export const CornMazeMissions: React.FC<Props> = ({ onBack }) => {
  const { portalService } = useContext(PortalContext);

  const minigame = useSelector(portalService, _minigame);
  const prize = useSelector(portalService, _prize);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayHistory = minigame?.history?.[todayKey];

  return (
    <div className="flex flex-col gap-1 max-h-[75vh]">
      <div className="flex flex-col gap-1 overflow-x-hidden overflow-y-auto scrollable px-1">
        <div className="flex justify-between items-center mb-1 py-1 pl-1">
          <Label type="default">{"Daily mission"}</Label>
        </div>

        {prize ? (
          <MinigamePrizeUI
            prize={prize}
            history={todayHistory}
            mission={`Mission: Collect ${prize.score} crows`}
          />
        ) : (
          <Label type="warning" icon={SUNNYSIDE.icons.expression_confused}>
            {"No mission available right now — check back later."}
          </Label>
        )}
      </div>

      <Button onClick={onBack}>{"Back"}</Button>
    </div>
  );
};
