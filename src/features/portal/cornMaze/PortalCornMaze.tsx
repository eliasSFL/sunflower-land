import React, { useContext, useEffect } from "react";
import { useActor, useSelector } from "@xstate/react";

import { Modal } from "components/ui/Modal";
import { Panel } from "components/ui/Panel";
import { Button } from "components/ui/Button";
import { Label } from "components/ui/Label";
import { Loading } from "features/auth/components";
import { Ocean } from "features/world/ui/Ocean";
import { useAppTranslation } from "lib/i18n/useAppTranslations";
import { CONFIG } from "lib/config";
import i18n from "lib/i18n";
import { changeFont } from "lib/utils/fonts";

import { PortalContext } from "./lib/PortalProvider";
import { PortalMachineState } from "./lib/portalMachine";
import { CornMazePhaser } from "./CornMazePhaser";
import { CornMazeHUD } from "./components/CornMazeHUD";
import { authorisePortal } from "../lib/portalUtil";
import { getFont, getLanguage } from "../actions/loadPortal";

const _gameState = (state: PortalMachineState) => state.context.state;

export const PortalCornMaze: React.FC = () => {
  const { portalService } = useContext(PortalContext);
  const [portalState] = useActor(portalService);
  const { t } = useAppTranslation();

  const gameState = useSelector(portalService, _gameState);

  useEffect(() => {
    const parentLanguage = getLanguage();
    const appLanguage = localStorage.getItem("language") || "en";
    if (appLanguage !== parentLanguage) {
      localStorage.setItem("language", parentLanguage);
      i18n.changeLanguage(parentLanguage);
    }
    changeFont(getFont());
  }, []);

  if (portalState.matches("error")) {
    return (
      <Ocean>
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="danger">{t("error")}</Label>
              <span className="text-sm my-2">{t("error.wentWrong")}</span>
            </div>
            <Button onClick={() => portalService.send("RETRY")}>
              {t("retry")}
            </Button>
          </Panel>
        </Modal>
      </Ocean>
    );
  }

  if (portalState.matches("unauthorised")) {
    return (
      <Ocean>
        <Modal show>
          <Panel>
            <div className="p-2">
              <Label type="danger">{t("error")}</Label>
              <span className="text-sm my-2">{t("session.expired")}</span>
            </div>
            <Button onClick={authorisePortal}>{t("welcome.login")}</Button>
          </Panel>
        </Modal>
      </Ocean>
    );
  }

  if (portalState.matches("initialising") || portalState.matches("loading")) {
    return (
      <Ocean>
        <Modal show>
          <Panel>
            <Loading />
            <span className="text-xs">
              {`${t("last.updated")}:${CONFIG.CLIENT_VERSION}`}
            </span>
          </Panel>
        </Modal>
      </Ocean>
    );
  }

  return (
    <div>
      {gameState && (
        <>
          <CornMazeHUD />
          <CornMazePhaser />
        </>
      )}
    </div>
  );
};
