export const coachSummaryEnabledStorageKey = "morning-coach.coach-summary-enabled";

export function loadCoachSummaryEnabled(): boolean {
  try {
    return window.localStorage.getItem(coachSummaryEnabledStorageKey) !== "false";
  } catch {
    return true;
  }
}

export function saveCoachSummaryEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(coachSummaryEnabledStorageKey, String(enabled));
  } catch {
    // The current browser session still honors the selected value.
  }
}
