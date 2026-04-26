import React, { useState } from "react";
import Decimal from "decimal.js-light";

import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { NumberInput } from "components/ui/NumberInput";
import crowIcon from "assets/decorations/crow_without_shadow.png";
import { CONFIG } from "lib/config";

import { donate } from "features/portal/lib/portalUtil";

const CONTRIBUTORS = ["Elias"];

export const CornMazeDonations: React.FC = () => {
  const [amount, setAmount] = useState(new Decimal(1));

  const increment = () => setAmount((value) => value.add(0.1));
  const decrement = () =>
    setAmount((value) =>
      value.lessThanOrEqualTo(0.1) ? new Decimal(0.1) : value.minus(0.1),
    );

  const handleDonate = () => {
    donate({
      matic: amount.toNumber(),
      address: CONFIG.PORTAL_DONATION_ADDRESS,
    });
  };

  // Flip to true if you want to gate donations off (e.g. address not finalised).
  const isComingSoon = !CONFIG.PORTAL_DONATION_ADDRESS;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col mb-1 p-2">
        <p className="mb-2 text-center">
          {
            "This minigame is created for the community. Donations are greatly appreciated!"
          }
        </p>

        <div className="flex flex-wrap mt-1 mb-4 gap-x-3 gap-y-1 justify-center">
          {CONTRIBUTORS.map((name) => (
            <Label key={name} type="chill" icon={crowIcon}>
              <span className="pl-1">{name}</span>
            </Label>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="flex">
            <Button className="w-12" onClick={decrement}>
              {"-"}
            </Button>
            <div className="flex items-center w-24 mx-2">
              <NumberInput
                value={amount}
                maxDecimalPlaces={1}
                isOutOfRange={amount.lessThan(0.1)}
                onValueChange={setAmount}
              />
            </div>
            <Button className="w-12" onClick={increment}>
              {"+"}
            </Button>
          </div>
          <span className="text-xs font-secondary my-2">{"Amount in POL"}</span>
        </div>

        {isComingSoon && (
          <Label type="default" className="mb-2">
            {"Coming soon"}
          </Label>
        )}
      </div>

      <Button
        onClick={handleDonate}
        disabled={isComingSoon || amount.lessThan(0.1)}
      >
        <span className="whitespace-nowrap">{"Donate"}</span>
      </Button>
    </div>
  );
};
