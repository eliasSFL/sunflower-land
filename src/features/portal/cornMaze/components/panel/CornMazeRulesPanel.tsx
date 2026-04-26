import React from "react";

import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { NPC_WEARABLES } from "lib/npcs";

import { CornMazeHome } from "./CornMazeHome";

interface Props {
  mode: "introduction" | "success" | "failed";
  showScore: boolean;
  showExitButton: boolean;
  confirmButtonText: string;
  onConfirm: () => void;
}

export const CornMazeRulesPanel: React.FC<Props> = ({
  mode,
  showScore,
  showExitButton,
  confirmButtonText,
  onConfirm,
}) => {
  return (
    <CloseButtonPanel
      className="overflow-y-hidden"
      bumpkinParts={NPC_WEARABLES.luna}
    >
      <CornMazeHome
        mode={mode}
        showScore={showScore}
        showExitButton={showExitButton}
        confirmButtonText={confirmButtonText}
        onConfirm={onConfirm}
      />
    </CloseButtonPanel>
  );
};
