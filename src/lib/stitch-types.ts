export const STITCH_TYPE_KEYS = [
  "maggam",
  "computer_embroidery",
  "blouse_design",
  "plain",
  "designer",
  "custom",
] as const;

export function stitchLabelKey(key: string | null | undefined) {
  if (!key) return "stitch.notSet";
  return `stitch.${key}`;
}
