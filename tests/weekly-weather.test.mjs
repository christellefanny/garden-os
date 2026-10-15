import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getGardenWeather,
  publicFetch,
  loadBriefContext,
} from "../lib/weekly-brief-server.ts";
const now = new Date("2026-10-12T14:00:00Z");
const coords = {
  enabled: true,
  day: 1,
  gardenId: "g",
  latitude: 41.6,
  longitude: -88.2,
};
test("weather converts Celsius and retains issuance, probability, and official alerts", async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    return Response.json(
      String(url).includes("/points/")
        ? {
            properties: {
              forecast: "https://api.weather.gov/gridpoints/LOT/1,1/forecast",
              timeZone: "America/Chicago",
            },
          }
        : String(url).includes("/alerts/")
          ? { features: [{ properties: { headline: "Frost advisory" } }] }
          : {
              properties: {
                updated: "2026-10-12T12:00:00Z",
                periods: [
                  {
                    name: "Friday Night",
                    temperature: 3,
                    temperatureUnit: "C",
                    startTime: "2026-10-16T18:00:00-05:00",
                    isDaytime: false,
                    shortForecast: "Clear",
                    probabilityOfPrecipitation: { value: 60 },
                  },
                ],
              },
            },
    );
  };
  try {
    const w = await getGardenWeather("Plainfield, IL", coords, now);
    assert.equal(w.periods[0].low, 37);
    assert.equal(w.periods[0].rain, 60);
    assert.deepEqual(w.alerts, ["Frost advisory"]);
    assert.equal(w.updated, "2026-10-12T12:00:00Z");
    assert.equal(calls.length, 3);
  } finally {
    global.fetch = original;
  }
});
test("stale forecasts, ambiguous towns, and source failures safely omit weather-dependent advice", async () => {
  const original = global.fetch;
  try {
    global.fetch = async (url) =>
      Response.json(
        String(url).includes("/points/")
          ? {
              properties: {
                forecast: "https://api.weather.gov/gridpoints/LOT/1,1/forecast",
              },
            }
          : String(url).includes("/alerts/")
            ? { features: [] }
            : { properties: { updated: "2026-10-09T12:00:00Z", periods: [] } },
      );
    const stale = await getGardenWeather("Plainfield, IL", coords, now);
    assert.deepEqual(stale.periods, []);
    assert.match(stale.warning, /stale/);
    const missing = await getGardenWeather("Plainfield", undefined, now);
    assert.match(missing.warning, /City, State/);
    global.fetch = async () =>
      Response.json({
        results: [
          {
            name: "Plainfield",
            admin1: "Illinois",
            country_code: "US",
            latitude: 41,
            longitude: -88,
          },
          {
            name: "Plainfield",
            admin1: "Illinois",
            country_code: "US",
            latitude: 40,
            longitude: -88,
          },
        ],
      });
    assert.match(
      (await getGardenWeather("Plainfield, IL", undefined, now)).warning,
      /ambiguous/,
    );
    global.fetch = async () => {
      throw new Error("Source unavailable");
    };
    assert.deepEqual(
      (await getGardenWeather("Plainfield, IL", coords, now)).periods,
      [],
    );
  } finally {
    global.fetch = original;
  }
});
test("public sources reject localhost, credentials, arbitrary hosts and insecure URLs before fetching", async () => {
  for (const url of [
    "http://api.weather.gov/points/1,2",
    "https://localhost/",
    "https://user:secret@api.weather.gov/",
    "https://evil.example/",
  ])
    await assert.rejects(publicFetch(url), /Unsupported source/);
});
test("cloud context filters ownership and reads spaces only through the selected owned garden", async () => {
  const calls = [];
  const db = {
    from(table) {
      const q = {
        select() {
          return q;
        },
        eq(field, value) {
          calls.push([table, field, value]);
          return q;
        },
        then(resolve) {
          resolve({
            data:
              table === "gardens"
                ? [{ id: "owned", name: "Garden" }]
                : table === "garden_os_state"
                  ? []
                  : [],
            error: null,
          });
        },
      };
      return q;
    },
  };
  const context = await loadBriefContext(db, "owner", "owned");
  assert.equal(context.garden.id, "owned");
  assert.ok(
    calls.some(
      (c) => c[0] === "gardens" && c[1] === "user_id" && c[2] === "owner",
    ),
  );
  assert.ok(
    calls.some(
      (c) =>
        c[0] === "growing_spaces" && c[1] === "garden_id" && c[2] === "owned",
    ),
  );
  assert.ok(
    !calls.some((c) => c[0] === "growing_spaces" && c[1] === "user_id"),
  );
  await assert.rejects(
    loadBriefContext(db, "owner", "someone-elses-garden"),
    /Choose an existing garden/,
  );
});
