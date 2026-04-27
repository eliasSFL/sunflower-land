import React, { useContext, useEffect, useRef } from "react";
import { Game, AUTO } from "phaser";
import NinePatchPlugin from "phaser3-rex-plugins/plugins/ninepatch-plugin.js";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

import { Preloader } from "features/world/scenes/Preloader";
import { useActor } from "@xstate/react";

import { PortalContext } from "./lib/PortalProvider";
import { CornMazeScene, setMazeDayOverride } from "./CornMazeScene";

export const CornMazePhaser: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);

  const game = useRef<Game | undefined>(undefined);
  const scene = "corn_maze";
  const scenes = [Preloader, CornMazeScene];

  // Mount the Phaser game exactly once. Map swaps (daily rotation, beta
  // selector, retries) happen via `scene.restart({ day })` from inside the
  // scene itself — see `CornMazeScene.init`. Tearing down the Game on every
  // day change races Phaser's async destroy and corrupts shared state
  // (parent div, audio context, WebGL).
  useEffect(() => {
    // Read the initial day off the machine context and stash it on the
    // module-level override so the scene constructor picks it up.
    setMazeDayOverride(portalState.context.selectedDay);

    const config: Phaser.Types.Core.GameConfig = {
      type: AUTO,
      fps: { target: 30, smoothStep: true },
      backgroundColor: "#000000",
      parent: "game-content",
      autoRound: true,
      pixelArt: true,
      plugins: {
        global: [
          { key: "rexNinePatchPlugin", plugin: NinePatchPlugin, start: true },
          {
            key: "rexVirtualJoystick",
            plugin: VirtualJoystickPlugin,
            start: true,
          },
        ],
      },
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: 0 } },
      },
      scene: scenes,
      loader: { crossOrigin: "anonymous" },
    };

    game.current = new Game(config);
    game.current.registry.set("initialScene", scene);
    game.current.registry.set("gameState", portalState.context.state);
    game.current.registry.set("id", portalState.context.id);
    game.current.registry.set("portalService", portalService);

    return () => {
      game.current?.destroy(true);
      game.current = undefined;
      setMazeDayOverride(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="game-content" />;
};
