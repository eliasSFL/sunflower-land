import React, { useState } from "react";
import { Modal } from "components/ui/Modal";

import observatory from "assets/sfts/mom/observatory.webp";
import observatoryAnimation from "assets/sfts/mom/mom_observatory_animation.webp";

import { Section } from "lib/utils/hooks/useScrollIntoView";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { CloseButtonPanel } from "features/game/components/CloseablePanel";
import { Loading } from "features/auth/components";
import { useSound } from "lib/utils/hooks/useSound";

export const Observatory: React.FC = () => {
  // Using rand value helps force-replay gifs.
  // Also, putting this in state ensures the gif doesn't replay during random component rerenders.
  const [playRand, setPlayRand] = useState<number | undefined>(undefined);
  const [modalTimer, setModalTimer] = useState<number>();
  const [loading, setLoading] = useState(false);

  const { play, isPlaying, stop } = useSound("observatory");

  const handleOpenTelescope = () => {
    setLoading(true);
    setPlayRand(Math.random() + 1); // PlayRand cannot be 0 when set
  };

  const handleCloseTelescope = () => {
    stop();

    setPlayRand(undefined);
    setModalTimer(clearTimeout(modalTimer) as undefined);
  };

  return (
    <>
      <div
        className="absolute w-full h-full hover:img-highlight cursor-pointer"
        onClick={handleOpenTelescope}
      >
        <img
          style={{
            width: `${PIXEL_SCALE * 31}px`,
            bottom: `${PIXEL_SCALE * 0}px`,
          }}
          id={Section.Observatory}
          className="absolute pointer-events-none"
          src={observatory}
          alt="Observatory"
        />
      </div>
      <Modal show={!!playRand} onHide={handleCloseTelescope}>
        <CloseButtonPanel onClose={handleCloseTelescope}>
          {loading && <Loading />}
          <div
            className="bg-[#1b1c1b] pb-3"
            hidden={loading || !playRand} // render and hide gif so gif have time to load
          >
            <img
              src={`${observatoryAnimation}?rand=${playRand}`} // Breaks cache and force replays the gif animation.
              alt="Telescope Animation"
              onLoad={() => {
                setLoading(false);
                if (!isPlaying() && playRand) {
                  play();
                  setModalTimer(window.setTimeout(handleCloseTelescope, 26000));
                }
              }}
            />
          </div>
        </CloseButtonPanel>
      </Modal>
    </>
  );
};
