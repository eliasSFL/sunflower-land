import React from "react";

import { Button } from "components/ui/Button";
import { SquareIcon } from "components/ui/SquareIcon";
import { SUNNYSIDE } from "assets/sunnyside";
import letter from "assets/icons/letter.png";
import factions from "assets/icons/factions.webp";

import { CornMazePage } from "./CornMazeHome";

interface Props {
  setPage: (page: CornMazePage) => void;
}

export const CornMazeNavigationButtons: React.FC<Props> = ({ setPage }) => {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <Button
        className="whitespace-nowrap capitalize w-[48px] h-[50px]"
        onClick={() => setPage("mailbox")}
      >
        <SquareIcon className="mt-0.5" icon={letter} width={9} />
      </Button>
      <Button
        className="whitespace-nowrap capitalize w-[48px] h-[50px]"
        onClick={() => setPage("missions")}
      >
        <SquareIcon className="mt-0.5" icon={factions} width={8} />
      </Button>
      <Button
        className="whitespace-nowrap capitalize w-[48px] h-[50px]"
        onClick={() => setPage("guide")}
      >
        <SquareIcon
          className="mt-0.5"
          icon={SUNNYSIDE.icons.expression_confused}
          width={8}
        />
      </Button>
    </div>
  );
};
