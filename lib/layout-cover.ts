/** Covers are local, compressed JPEGs. Never treat an external URL as a private cover. */
export function validLayoutCover(value: unknown): value is string {
  return typeof value === "string" && value.length < 100000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value);
}
