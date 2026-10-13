"use client";

import * as React from "react";
import { OnboardingModal } from "./onboarding-modal";
import { useAuth } from "./auth-provider";

export function OnboardingWrapper() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("furni_open_onboarding", handleOpen);

    // If user is logged in, not admin, and hasn't seen onboarding yet
    if (user && user.role !== "admin") {
      const completed = localStorage.getItem("furni_onboarding_completed");
      if (!completed && user.is_onboarded) {
        setIsOpen(true);
      }
    }

    return () => {
      window.removeEventListener("furni_open_onboarding", handleOpen);
    };
  }, [user]);

  return (
    <OnboardingModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      userRole={user?.role}
    />
  );
}
