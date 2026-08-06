import { render, screen } from "@testing-library/react";
import React from "react";

import { MoodTrend } from "@/components/mood-trend";
import type { MorningCheckinResponse } from "@/lib/api/types";

function snapshot(day: string, mood: number | null): MorningCheckinResponse {
  return {
    id: `snapshot-${day}`,
    browser_date: `2026-08-${day}`,
    status: "completed",
    answers: [mood, null, null, null, null, null],
    next_question_number: null,
    coach_summary: null,
  };
}

test("shows no trend until two snapshots have a valid mood", () => {
  const { rerender } = render(<MoodTrend snapshots={[snapshot("01", 4)]} />);

  expect(screen.queryByRole("img", { name: /Stimmungsverlauf/ })).not.toBeInTheDocument();

  rerender(<MoodTrend snapshots={[snapshot("01", 4), snapshot("02", null)]} />);

  expect(screen.queryByRole("img", { name: /Stimmungsverlauf/ })).not.toBeInTheDocument();
});

test("uses the ten most recent valid moods in chronological order with an accessible description", () => {
  const snapshots = [
    snapshot("01", 1),
    snapshot("02", 2),
    snapshot("03", 3),
    snapshot("04", 4),
    snapshot("05", 5),
    snapshot("06", 1),
    snapshot("07", 2),
    snapshot("08", 3),
    snapshot("09", 4),
    snapshot("10", 5),
    snapshot("11", 1),
    snapshot("12", 2),
    snapshot("13", null),
  ].reverse();

  render(<MoodTrend snapshots={snapshots} />);

  const chart = screen.getByRole("img", { name: /Stimmungsverlauf/ });
  expect(chart).toHaveAccessibleName(
    "Stimmungsverlauf: 3 von 5 am 3. August 2026; 4 von 5 am 4. August 2026; 5 von 5 am 5. August 2026; 1 von 5 am 6. August 2026; 2 von 5 am 7. August 2026; 3 von 5 am 8. August 2026; 4 von 5 am 9. August 2026; 5 von 5 am 10. August 2026; 1 von 5 am 11. August 2026; 2 von 5 am 12. August 2026",
  );
  expect(screen.getByText("3. Aug.")).toBeInTheDocument();
  expect(screen.getByText("12. Aug.")).toBeInTheDocument();
  expect(screen.queryByText("1. Aug.")).not.toBeInTheDocument();
});
