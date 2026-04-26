import React from "react";

import { Label } from "components/ui/Label";
import { BuffLabel } from "features/game/types";

export type NoticeboardItemsElements = {
  text: string | React.ReactNode;
  icon?: string;
  label?: BuffLabel;
};

interface Props {
  items: NoticeboardItemsElements[];
  iconWidth?: number;
}

/**
 * Portal-side copy of `features/world/ui/kingdom/KingdomNoticeboard#NoticeboardItems`.
 * Lives here so portal panels can render the same iconed-row layout without
 * pulling in main-game world UI as a dependency.
 */
export const NoticeboardItems: React.FC<Props> = ({
  items,
  iconWidth = 12,
}) => {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => (
        <div className="flex mb-1 items-center" key={index}>
          <div className={`w-${iconWidth} flex justify-center`}>
            {item.icon && (
              <img src={item.icon} className="h-6 mr-2 object-contain" />
            )}
          </div>
          <div className="w-full">
            <p className="text-xs flex-1">{item.text}</p>
            {item.label && (
              <Label
                type={item.label.labelType}
                icon={item.label.boostTypeIcon}
                secondaryIcon={item.label.boostedItemIcon}
              >
                {item.label.shortDescription}
              </Label>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
