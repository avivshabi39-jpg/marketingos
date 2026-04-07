import { track } from "@vercel/analytics";

export function trackLeadCreated(source: string) {
  track("lead_created", { source });
}

export function trackLeadStatusChanged(from: string, to: string) {
  track("lead_status_changed", { from, to });
}

export function trackBroadcastSent(count: number) {
  track("broadcast_sent", { recipientCount: count });
}

export function trackOnboardingStep(step: number, total: number) {
  track("onboarding_step", { step, total });
}

export function trackOnboardingCompleted() {
  track("onboarding_completed");
}

export function trackCommandUsed(commandId: string) {
  track("command_used", { commandId });
}

export function trackDarkModeToggled(isDark: boolean) {
  track("dark_mode_toggled", { mode: isDark ? "dark" : "light" });
}
