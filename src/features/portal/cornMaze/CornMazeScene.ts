import cornMazeJSON from "assets/map/corn_maze.json";

import { BaseScene, NPCBumpkin } from "features/world/scenes/BaseScene";
import { SceneId } from "features/world/mmoMachine";
import { NPC_WEARABLES } from "lib/npcs";
import { BumpkinContainer } from "features/world/containers/BumpkinContainer";
import { SOUNDS } from "assets/sound-effects/soundEffects";
import { ENEMIES, Enemy } from "./lib/enemies";
import { MachineInterpreter } from "./lib/portalMachine";

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
  // v1 runs the week 1 maze layout; rotation lives in ENEMIES for later.
  currentWeek = 1;

  enemies?: Phaser.GameObjects.Group;
  spotlight?: Phaser.GameObjects.Image;
  mazePortal?: Phaser.GameObjects.Sprite;

  constructor() {
    super({
      name: "corn_maze",
      // The maze map was authored against the 2023 tilesheet (corn walls + witches eve
      // decorations at GIDs that have since been reassigned). Point BaseScene at the
      // portal-local archived tilesheet so the GIDs still resolve to the right art.
      map: { json: cornMazeJSON, imageKey: "corn_maze_tileset" },
      audio: { fx: { walk_key: "sand_footstep" } },
    });
  }

  public get portalService(): MachineInterpreter | undefined {
    return this.registry.get("portalService");
  }

  preload() {
    super.preload();

    this.load.image("corn_maze_tileset", "world/corn_maze_tileset.png");

    this.load.spritesheet("maze_portal", "world/maze_portal.png", {
      frameWidth: 12,
      frameHeight: 12,
    });
    this.load.image("crow", "world/crow.png");
    this.load.image("spotlight", "world/spotlight.webp");

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
    this.setUpSpotlight();
    this.setUpCrows();

    // Scene boots paused; HUD resumes it once the player dismisses the tips modal.
    this.scene.pause();

    // The portal machine drives pause/resume/stop + scene restart on retry.
    let previousState: string | undefined;
    const subscription = this.portalService?.subscribe((state) => {
      const current = state.value as string;

      // Retry: returning to `ready` from a terminal state means the player wants
      // another attempt — restart the scene to respawn crows/enemies/player.
      if (current === "ready" && previousState === "gameover") {
        previousState = current;
        this.scene.restart();
        return;
      }
      previousState = current;

      if (state.matches("ready") || state.matches("gameover")) {
        if (!this.scene.isPaused()) this.scene.pause();
      }

      if (state.matches("playing")) {
        if (this.scene.isPaused()) this.scene.resume();
        this.mazePortal?.play("maze_portal_anim", true);
        // Re-arm portal hit when a new attempt starts.
        this.canHandlePortalHit = true;
      }
    });

    // Drop the subscription when the scene is shut down (e.g. on restart) so we
    // don't leak callbacks against the long-lived portal service.
    this.events.once("shutdown", () => subscription?.unsubscribe());

    this.portalService?.send("SCENE_LOADED");
  }

  setUpSpotlight() {
    this.spotlight = this.add.image(0, 0, "spotlight");
    this.spotlight.setOrigin(0, 0);
    this.spotlight.setDepth(100000000000);
    this.updateSpotlightPosition();
  }

  updateSpotlightPosition() {
    if (this.currentPlayer && this.spotlight) {
      this.spotlight.x = this.currentPlayer.x - this.spotlight.width / 2;
      this.spotlight.y = this.currentPlayer.y - this.spotlight.height / 2;
    }
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
    const enemies = ENEMIES[this.currentWeek] ?? [];

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
    this.updateSpotlightPosition();
  }
}
