import maze1 from "./maps/maze1.json";
import maze2 from "./maps/maze2.json";
import maze3 from "./maps/maze3.json";
import maze4 from "./maps/maze4.json";
import maze5 from "./maps/maze5.json";
import maze6 from "./maps/maze6.json";
import maze7 from "./maps/maze7.json";
import maze8 from "./maps/maze8.json";
import maze9 from "./maps/maze9.json";
import maze13 from "./maps/maze13.json";

// 10 unique maps across the 13-week Witches' Eve season: weeks 10-12 reused
// weeks 1-3 in the original, and week 13 was the one-off Halloween maze.
export const CORN_MAZES: Record<number, unknown> = {
  1: maze1,
  2: maze2,
  3: maze3,
  4: maze4,
  5: maze5,
  6: maze6,
  7: maze7,
  8: maze8,
  9: maze9,
  10: maze1,
  11: maze2,
  12: maze3,
  13: maze13,
};

export const TOTAL_MAZE_WEEKS = 13;

/**
 * Picks the maze week for today. Cycles through weeks 1-13 on a daily cadence —
 * same week for all attempts started on the same UTC day, advances to the next
 * week at UTC midnight.
 */
export function getCurrentMazeWeek(now: number = Date.now()): number {
  const day = Math.floor(now / 86_400_000);
  return (day % TOTAL_MAZE_WEEKS) + 1;
}
