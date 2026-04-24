import React from "react";

import { WalletProvider } from "features/wallet/WalletProvider";

import { PortalProvider as CornMazePortalProvider } from "./cornMaze/lib/PortalProvider";
import { PortalCornMaze } from "./cornMaze/PortalCornMaze";

export const PortalApp: React.FC = () => {
  return (
    <WalletProvider>
      <CornMazePortalProvider>
        <PortalCornMaze />
      </CornMazePortalProvider>
    </WalletProvider>
  );
};
