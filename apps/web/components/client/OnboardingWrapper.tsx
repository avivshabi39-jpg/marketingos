"use client";

import { useState } from "react";
import { OnboardingWizard } from "./OnboardingWizard";

interface Props {
  clientId: string;
  clientName: string;
  onboardingDone: boolean;
  children: React.ReactNode;
}

export function OnboardingWrapper({
  clientId,
  clientName,
  onboardingDone,
  children,
}: Props) {
  const [show, setShow] = useState(!onboardingDone);

  return (
    <>
      {show && (
        <OnboardingWizard
          clientId={clientId}
          clientName={clientName}
          onComplete={() => setShow(false)}
        />
      )}
      {children}
    </>
  );
}
