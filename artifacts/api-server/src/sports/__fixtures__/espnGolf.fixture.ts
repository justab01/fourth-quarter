export const ESPN_GOLF_SCOREBOARD_FIXTURE = {
  events: [
    {
      id: "401-test-live",
      name: "Test Championship",
      shortName: "Test Championship",
      date: "2026-08-06T12:00:00Z",
      status: {
        period: 3,
        type: { state: "in", description: "Round 3", detail: "Round 3 - In Progress" },
      },
      competitions: [
        {
          venue: {
            fullName: "Sedgefield Country Club",
            address: { city: "Greensboro", state: "NC", country: "USA" },
          },
          competitors: [
            {
              id: "1",
              order: 1,
              score: "-10",
              athlete: {
                id: "1",
                displayName: "Jordan Fairway",
                shortName: "J. Fairway",
                headshot: { href: "https://example.test/jordan.png" },
                flag: { alt: "USA" },
              },
              linescores: [
                {
                  value: 68,
                  displayValue: "-2",
                  period: 1,
                  linescores: Array.from({ length: 18 }, (_, index) => ({
                    value: 4,
                    displayValue: "4",
                    period: index + 1,
                    scoreType: { displayValue: "E" },
                  })),
                },
                {
                  value: 66,
                  displayValue: "-4",
                  period: 2,
                  linescores: Array.from({ length: 18 }, (_, index) => ({
                    value: 4,
                    displayValue: "4",
                    period: index + 1,
                    scoreType: { displayValue: "E" },
                  })),
                },
                {
                  displayValue: "-4",
                  period: 3,
                  linescores: [10, 11, 12, 13, 14, 15, 16].map((hole, index) => ({
                    value: index === 1 ? 3 : 4,
                    displayValue: index === 1 ? "3" : "4",
                    period: hole,
                    scoreType: { displayValue: index === 1 ? "-1" : "E" },
                  })),
                },
                { period: 4 },
              ],
            },
            {
              id: "2",
              order: 2,
              score: "-10",
              athlete: { id: "2", displayName: "Avery Links (a)", flag: { alt: "England" } },
              linescores: [
                {
                  value: 67,
                  displayValue: "-3",
                  period: 1,
                  linescores: Array.from({ length: 18 }, (_, index) => ({
                    value: 4,
                    displayValue: "4",
                    period: index + 1,
                    scoreType: { displayValue: "E" },
                  })),
                },
              ],
            },
            {
              id: "3",
              order: 90,
              score: "+5",
              status: { type: "cut", displayValue: "CUT" },
              athlete: { id: "3", displayName: "Casey Cut" },
              linescores: [],
            },
          ],
        },
      ],
    },
  ],
} as const;
