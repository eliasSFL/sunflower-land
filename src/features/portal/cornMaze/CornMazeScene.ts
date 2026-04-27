import { BaseScene, NPCBumpkin } from "features/world/scenes/BaseScene";
import { SceneId } from "features/world/mmoMachine";
import { NPC_WEARABLES } from "lib/npcs";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { SOUNDS } from "assets/sound-effects/soundEffects";
import { ENEMIES, Enemy } from "./lib/enemies";
import { CORN_MAZES, getCurrentMazeDay } from "./lib/mazes";
import { MachineInterpreter } from "./lib/portalMachine";

/**
 * Module-level override for the maze day that should be loaded when the next
 * `CornMazeScene` instance is constructed. The Phaser registry isn't available
 * during `super()`, so we can't read context off the portal service from inside
 * the constructor; the React layer sets this before calling `new Game()` and
 * clears it on teardown. `undefined` falls back to the daily rotation.
 */
let mazeDayOverride: number | undefined;
export function setMazeDayOverride(day: number | undefined) {
  mazeDayOverride = day;
}

const LUNA: NPCBumpkin = {
  x: 333,
  y: 330,
  npc: "luna",
  direction: "left",
};

export class CornMazeScene extends BaseScene {
  sceneId: SceneId = "corn_maze";
  // Don't allow portal hit to be triggered multiple times
  canHandlePortalHit = true;
  currentDay: number;

  enemies?: Phaser.GameObjects.Group;
  mazePortal?: Phaser.GameObjects.Sprite;

  constructor() {
    // Pick the day once at scene construction. By default we follow the UTC
    // daily rotation; a beta map-selector can override via `setMazeDayOverride`
    // before the React layer creates the Phaser game so testers can pick a
    // specific layout.
    const day = mazeDayOverride ?? getCurrentMazeDay();

    super({
      name: "corn_maze",
      // The maze maps were authored against the 2023 tilesheet (corn walls + witches eve
      // decorations at GIDs that have since been reassigned). Point BaseScene at the
      // portal-local archived tilesheet so the GIDs still resolve to the right art.
      map: { json: CORN_MAZES[day], imageKey: "corn_maze_tileset" },
      audio: { fx: { walk_key: "sand_footstep" } },
    });

    this.currentDay = day;
  }

  public get portalService(): MachineInterpreter | undefined {
    return this.registry.get("portalService");
  }

  /**
   * Phaser fires `init` on every `scene.start()` / `scene.restart()`. We use
   * the optional `day` payload to swap the maze layout in place — no Game
   * teardown required. The tilemap key gets nuked from the cache so
   * `BaseScene.preload` re-loads the new day's JSON instead of reusing the
   * previously cached one.
   */
  init(data?: { day?: number }) {
    if (data?.day === undefined || data.day === this.currentDay) return;
    this.currentDay = data.day;
    // `options` is private on BaseScene but BaseScene.preload reads it via
    // reference, so mutating before preload runs picks up the new JSON.
    (
      this as unknown as { options: { map: { json: unknown } } }
    ).options.map.json = CORN_MAZES[data.day];
    if (this.cache.tilemap.has("corn_maze")) {
      this.cache.tilemap.remove("corn_maze");
    }
  }

  preload() {
    super.preload();

    this.load.image("corn_maze_tileset", "world/corn_maze_tileset.png");

    this.load.spritesheet("maze_portal", "world/maze_portal.png", {
      frameWidth: 12,
      frameHeight: 12,
    });
    this.load.image("crow", "world/crow.png");

    this.load.audio("ouph", SOUNDS.voices.ouph);
    this.load.audio("crow_collected", SOUNDS.notifications.crow_collected);
  }

  create() {
    super.create();

    if (window.innerWidth < 500) {
      this.cameras.main.setZoom(2.3);
    }

    this.setUpPortal();
    this.setUpLuna();
    this.setUpEnemies();
    this.setUpEnemyColliders();
    this.setUpCrows();

    // Scene boots paused; HUD resumes it once the player dismisses the tips modal.
    this.scene.pause();

    // The portal machine drives pause/resume/stop + scene restart on retry
    // and day swap on the beta map selector.
    let previousState: string | undefined;
    let previousDay: number = this.currentDay;
    const subscription = this.portalService?.subscribe((state) => {
      // Defensive: stale subscriptions from a destroyed scene fire with a
      // null `this.scene`. Bail and let the shutdown handler unsubscribe.
      if (!this.scene) return;

      const current = state.value as string;
      const requestedDay = state.context.selectedDay ?? getCurrentMazeDay();

      // Beta map selector changed — restart the scene with the new day so
      // `init` can swap the tilemap JSON and reload everything cleanly.
      if (requestedDay !== previousDay) {
        previousDay = requestedDay;
        previousState = current;
        this.scene.restart({ day: requestedDay });
        return;
      }

      // Retry: returning to `ready` from a terminal state means the player wants
      // another attempt — restart the scene to respawn crows/enemies/player.
      if (current === "ready" && previousState === "gameover") {
        previousState = current;
        this.scene.restart({ day: this.currentDay });
        return;
      }
      previousState = current;

      if (
        state.matches("ready") ||
        state.matches("gameover") ||
        state.matches("confirmingExit")
      ) {
        if (!this.scene.isPaused()) this.scene.pause();
      }

      if (state.matches("playing")) {
        if (this.scene.isPaused()) this.scene.resume();
        this.mazePortal?.play("maze_portal_anim", true);
        // Re-arm portal hit when a new attempt starts (or the player cancels
        // an early-exit confirmation and returns to playing).
        this.canHandlePortalHit = true;
      }
    });

    // Drop the subscription on shutdown AND destroy — destroy fires when the
    // host Game is torn down without a prior shutdown.
    const cleanup = () => subscription?.unsubscribe();
    this.events.once("shutdown", cleanup);
    this.events.once("destroy", cleanup);

    this.portalService?.send("SCENE_LOADED");
  }

  setUpPortal() {
    this.mazePortal = this.add.sprite(320, 319, "maze_portal");

    this.anims.create({
      key: "maze_portal_anim",
      frames: this.anims.generateFrameNumbers("maze_portal", {
        start: 0,
        end: 12,
      }),
      repeat: -1,
      frameRate: 10,
    });
  }

  setUpLuna() {
    const container = new BumpkinContainer({
      scene: this,
      x: LUNA.x,
      y: LUNA.y,
      clothing: { ...NPC_WEARABLES.luna, updatedAt: 0 },
      direction: "left",
    });

    (container.body as Phaser.Physics.Arcade.Body)
      .setSize(16, 20)
      .setOffset(0, 0)
      .setImmovable(true)
      .setCollideWorldBounds(true);

    this.physics.world.enable(container);

    if (this.currentPlayer) {
      this.physics.add.collider(container, this.currentPlayer, () => {
        this.handlePortalHit();
      });
    }
  }

  handlePortalHit() {
    if (!this.canHandlePortalHit) return;
    this.canHandlePortalHit = false;
    this.portalService?.send("PORTAL_HIT");
  }

  setUpCrows() {
    const crowsLayer = this.map.getLayer("Crows");
    if (!crowsLayer) return;

    const tileData = crowsLayer.data;
    const tileWidth = this.map.tileWidth;
    const tileHeight = this.map.tileHeight;

    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const tile = tileData[y][x];
        if (tile.index === -1) continue;

        const spriteX = x * tileWidth + tileWidth / 2;
        const spriteY = y * tileHeight + tileHeight / 2;
        const crowId = `${spriteX}-${spriteY}`;

        const crow = this.physics.add.sprite(spriteX, spriteY, "crow");
        if (this.currentPlayer) {
          this.physics.add.overlap(this.currentPlayer, crow, () => {
            this.collect(crowId);
            const collected = this.sound.add("crow_collected");
            collected.play({ volume: 0.7 });
            crow.destroy();
          });
        }
      }
    }
  }

  setUpEnemies() {
    this.enemies = this.add.group();
    const enemies = ENEMIES[this.currentDay] ?? [];

    enemies.forEach((enemy) => {
      const container = new BumpkinContainer({
        scene: this,
        x: enemy.x,
        y: enemy.y,
        clothing: {
          ...(enemy.clothing ?? NPC_WEARABLES[enemy.npc]),
          updatedAt: 0,
        },
        direction: enemy.target.startFacingLeft ? "left" : "right",
      });

      container.setDepth(enemy.y);
      (container.body as Phaser.Physics.Arcade.Body)
        .setSize(16, 20)
        .setOffset(0, 0)
        .setCollideWorldBounds(true);

      this.physics.world.enable(container);
      container.walk();
      this.enemies?.add(container);

      const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: container,
        x: enemy.target.x,
        y: enemy.target.y,
        duration: enemy.target.duration,
        ease: "Linear",
        repeat: -1,
        yoyo: true,
        onUpdate: (tween, target) => {
          if (!target.isWalking && !enemy.target.hold) {
            target.walk();
          }

          if (enemy.target.direction === "horizontal") {
            this.handleDirectionChange(enemy, target as BumpkinContainer);
          }

          if (enemy.target.hold) {
            this.handleRandomEnemyHold(
              tween,
              enemy,
              target as BumpkinContainer,
            );
          }
        },
      };

      this.tweens.add(tweenConfig);
    });
  }

  setUpEnemyColliders() {
    if (!this.currentPlayer || !this.enemies) return;

    this.physics.add.overlap(this.currentPlayer, this.enemies, () => {
      if (!this.currentPlayer?.invincible) {
        this.portalService?.send("HIT_ENEMY");
        const hit = this.sound.add("ouph");
        hit.play({ volume: 0.5 });
        this.currentPlayer?.hitPlayer();
      }
    });
  }

  handleDirectionChange(enemy: Enemy, container: BumpkinContainer) {
    const startDirection = enemy.target.startFacingLeft ? "left" : "right";
    if (startDirection === "right") {
      if (
        container.x === enemy.target.x &&
        container.directionFacing === "right"
      ) {
        container.faceLeft();
      } else if (
        container.x === enemy.x &&
        container.directionFacing === "left"
      ) {
        container.faceRight();
      }
    } else {
      if (
        container.x === enemy.target.x &&
        container.directionFacing === "left"
      ) {
        container.faceRight();
      } else if (
        container.x === enemy.x &&
        container.directionFacing === "right"
      ) {
        container.faceLeft();
      }
    }
  }

  handleRandomEnemyHold(
    tween: Phaser.Tweens.Tween,
    enemy: Enemy,
    container: BumpkinContainer,
  ) {
    const minHoldTime = 1;
    const maxHoldTime = enemy.target.duration + 1000;
    const randomHoldTime = Phaser.Math.Between(minHoldTime, maxHoldTime);

    if (
      enemy.target.direction === "horizontal" &&
      container.x === enemy.target.x
    ) {
      tween.pause();
      container.idle();
      setTimeout(() => {
        if (tween && tween.isPaused()) {
          tween.resume();
          container.walk();
        }
      }, randomHoldTime);
    } else if (
      enemy.target.direction === "vertical" &&
      container.y === enemy.target.y
    ) {
      tween.pause();
      container.idle();
      setTimeout(() => {
        tween.resume();
        container.walk();
      }, randomHoldTime);
    }
  }

  collect(crowId: string) {
    this.portalService?.send({ type: "COLLECT_CROW", crowId });
  }

  update(): void {
    super.update();
  }
}
