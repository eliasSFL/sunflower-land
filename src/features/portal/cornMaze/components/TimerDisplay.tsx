import React from "react";
import classNames from "classnames";
import { secondsToString } from "lib/utils/time";
import { Label } from "components/ui/Label";
import { SUNNYSIDE } from "assets/sunnyside";

interface Props {
  timeLeft: number;
}

export const TimerDisplay: React.FC<Props> = ({ timeLeft }) => {
  const runningOutOfTime = timeLeft > 0 && timeLeft < 25;

  return (
    <div className="absolute right-2 bottom-2">
      <Label
        type={runningOutOfTime || timeLeft === 0 ? "danger" : "info"}
        className={classNames({ "warn-pulse": runningOutOfTime })}
        icon={SUNNYSIDE.icons.stopwatch}
      >
        {timeLeft > 0
          ? secondsToString(timeLeft, { length: "medium" })
          : "Time's up!"}
      </Label>
    </div>
  );
};
