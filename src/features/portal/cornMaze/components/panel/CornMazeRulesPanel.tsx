import React, { useState } from "react";

import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { NPC_WEARABLES } from "lib/npcs";
import { SUNNYSIDE } from "assets/sunnyside";
import crowIcon from "assets/decorations/crow_without_shadow.png";

import { CornMazeHome } from "./CornMazeHome";
import { CornMazeDonations } from "./CornMazeDonations";

type Tab = "home" | "donate";

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
  const [tab, setTab] = useState<Tab>("home");

  return (
    <CloseButtonPanel
      className="overflow-y-hidden"
      bumpkinParts={NPC_WEARABLES.luna}
      currentTab={tab}
      setCurrentTab={setTab}
      tabs={[
        { icon: crowIcon, name: "Minigame", id: "home" },
        { icon: SUNNYSIDE.icons.heart, name: "Donate", id: "donate" },
      ]}
    >
      <>
        {tab === "home" && (
          <CornMazeHome
            mode={mode}
            showScore={showScore}
            showExitButton={showExitButton}
            confirmButtonText={confirmButtonText}
            onConfirm={onConfirm}
          />
        )}
        {tab === "donate" && <CornMazeDonations />}
      </>
    </CloseButtonPanel>
  );
};
