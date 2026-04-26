import React from "react";

import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";

interface Props {
  onBack: () => void;
}

export const CornMazeMailbox: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="flex flex-col gap-1 max-h-[75vh]">
      <div className="flex flex-col gap-2 overflow-x-hidden overflow-y-auto scrollable px-1">
        <div className="flex justify-between items-center mb-1 py-1 pl-1">
          <Label type="default">{"Mailbox"}</Label>
        </div>

        <div className="flex flex-col items-center gap-2 py-4">
          <img
            src={SUNNYSIDE.icons.expression_confused}
            className="w-6 h-6 opacity-60"
          />
          <span className="text-xs text-center px-2">
            {"No new mail. Check back later for messages from Luna."}
          </span>
        </div>
      </div>

      <Button onClick={onBack}>{"Back"}</Button>
    </div>
  );
};
