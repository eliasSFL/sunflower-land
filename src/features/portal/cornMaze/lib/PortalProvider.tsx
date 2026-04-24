import React, { useEffect } from "react";
import { useInterpret } from "@xstate/react";
import { MachineInterpreter, portalMachine } from "./portalMachine";

interface PortalContext {
  portalService: MachineInterpreter;
}

export const PortalContext = React.createContext<PortalContext>(
  {} as PortalContext,
);

export const PortalProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const portalService = useInterpret(
    portalMachine,
  ) as unknown as MachineInterpreter;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.event === "purchased") {
        portalService.send("PURCHASED");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <PortalContext.Provider value={{ portalService }}>
      {children}
    </PortalContext.Provider>
  );
};
