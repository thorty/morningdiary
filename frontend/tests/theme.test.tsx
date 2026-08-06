import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { ThemePicker } from "@/components/theme-picker";
import { resolveAutomaticTheme } from "@/lib/theme";

test("automatic theme follows the newest Daily Snapshot with a mood", () => {
  expect(resolveAutomaticTheme([
    { browser_date: "2026-08-03", answers: [5] },
    { browser_date: "2026-08-05", answers: [2] },
    { browser_date: "2026-08-06", answers: [9] },
  ])).toBe("purple");
});

test("theme picker persists a selected color across mounts", () => {
  const { unmount } = render(<ThemePicker automaticTheme="orange" />);

  fireEvent.click(screen.getByRole("button", { name: "Farbstimmung Blau" }));
  expect(document.documentElement.dataset.theme).toBe("blue");
  expect(window.localStorage.getItem("morning-coach.theme")).toBe("blue");

  unmount();
  render(<ThemePicker automaticTheme="orange" />);
  expect(screen.getByRole("button", { name: "Farbstimmung Blau" })).toHaveAttribute("aria-pressed", "true");

  fireEvent.click(screen.getByRole("button", { name: "Automatisch" }));
  expect(document.documentElement.dataset.theme).toBe("orange");
  expect(window.localStorage.getItem("morning-coach.theme")).toBe("auto");
});
