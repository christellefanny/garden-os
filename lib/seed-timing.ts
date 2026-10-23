/** Read an explicit packet window without assuming a species' seed requirements. */
export function packetSeedTiming(
  plant: { name: string; notes: string },
  lastFrost: string,
  year: number,
) {
  const instruction = plant.notes
    .split(/[\n.]/)
    .find(
      (line) =>
        /(?:start|sow)[^\n]*indoors?\b/i.test(line) &&
        /\d+(?:\s*[-–—]\s*\d+)?\s+weeks?\s+before/i.test(line),
    );
  const match = instruction?.match(
    /(\d+)(?:\s*[-–—]\s*(\d+))?\s+weeks?\s+before\s+(.+)/i,
  );
  if (!match) return null;
  const low = Number(match[1]),
    high = Number(match[2] || match[1]);
  if (low < 1 || high < low || high > 52) return null;
  const frost = /last (?:killing )?frost/i.test(match[3]);
  if (
    !frost &&
    !/outdoor planting|planting outdoors|transplant|warm weather/i.test(
      match[3],
    )
  )
    return null;
  const cool = /cauliflower|broccoli|cabbage|kale|lettuce|pansy/i.test(
      plant.name,
    ),
    offset = frost ? 0 : cool ? -21 : 10;
  const date = new Date(`${year}-${lastFrost}T12:00:00Z`);
  date.setUTCDate(
    date.getUTCDate() + offset - Math.round(((low + high) / 2) * 7),
  );
  return {
    date: date.toISOString().slice(0, 10),
    window: low === high ? `${low} weeks` : `${low}–${high} weeks`,
    frost,
    cool,
    range: low !== high,
  };
}
