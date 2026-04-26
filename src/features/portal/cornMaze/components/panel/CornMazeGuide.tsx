import React from "react";

import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";
import crowIcon from "assets/decorations/crow_without_shadow.png";
import { PIXEL_SCALE } from "features/game/lib/constants";

import { NoticeboardItems } from "features/portal/components/NoticeboardItems";
import { TOTAL_CROWS } from "../../lib/portalMachine";

interface Props {
  onBack: () => void;
}

export const CornMazeGuide: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center mb-1 py-1 pl-1">
        <img
          src={SUNNYSIDE.icons.arrow_left}
          className="cursor-pointer hidden sm:block"
          alt="back"
          style={{
            width: `${PIXEL_SCALE * 11}px`,
            marginRight: `${PIXEL_SCALE * 4}px`,
          }}
          onClick={onBack}
        />
        <Label type="default" icon={SUNNYSIDE.icons.expression_confused}>
          {"How to play"}
        </Label>
      </div>

      <NoticeboardItems
        items={[
          {
            icon: crowIcon,
            text: `Find all ${TOTAL_CROWS} crows hidden in the maze before time runs out.`,
          },
          {
            icon: SUNNYSIDE.icons.heart,
            text: "You have 3 lives per attempt. Wandering enemies cost you a life on contact, with brief invincibility after a hit.",
          },
          {
            icon: SUNNYSIDE.icons.stopwatch,
            text: "Each run lasts 3 minutes. Touch Luna at the portal at any time to end early and lock in your score.",
          },
          {
            icon: SUNNYSIDE.icons.expression_confused,
            text: "The maze layout and enemy patrols change every day, so come back tomorrow for a fresh challenge.",
          },
        ]}
      />
    </div>
  );
};
