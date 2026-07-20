/** Preset bill line items — grouped for quick selection on create/edit bill. */

export type BillPresetGroupId =
  | "embroidery_work"
  | "blouse"
  | "garments"
  | "saree_uniform";

export type BillPresetItemId =
  | "maggam_work"
  | "computer_embroidery"
  | "machine_embroidery"
  | "lining_blouse"
  | "normal_blouse"
  | "model_blouse"
  | "shape_blouse_lining"
  | "dress"
  | "top"
  | "restitching"
  | "saree_falls"
  | "saree_falls_mudulu"
  | "hangings"
  | "school_uniform";

export type BillPresetGroup = {
  id: BillPresetGroupId;
  labelKey: string;
};

export type BillPresetItem = {
  id: BillPresetItemId;
  groupId: BillPresetGroupId;
  labelKey: string;
};

/** Display order: embroidery → blouse → dress/top → saree/uniform */
export const BILL_PRESET_GROUPS: BillPresetGroup[] = [
  { id: "embroidery_work", labelKey: "billPresetGroup.embroideryWork" },
  { id: "blouse", labelKey: "billPresetGroup.blouse" },
  { id: "garments", labelKey: "billPresetGroup.garments" },
  { id: "saree_uniform", labelKey: "billPresetGroup.sareeUniform" },
];

export const BILL_PRESET_ITEMS: BillPresetItem[] = [
  { id: "maggam_work", groupId: "embroidery_work", labelKey: "billPreset.maggamWork" },
  { id: "computer_embroidery", groupId: "embroidery_work", labelKey: "billPreset.computerEmbroidery" },
  { id: "machine_embroidery", groupId: "embroidery_work", labelKey: "billPreset.machineEmbroidery" },
  { id: "lining_blouse", groupId: "blouse", labelKey: "billPreset.liningBlouse" },
  { id: "normal_blouse", groupId: "blouse", labelKey: "billPreset.normalBlouse" },
  { id: "model_blouse", groupId: "blouse", labelKey: "billPreset.modelBlouse" },
  { id: "shape_blouse_lining", groupId: "blouse", labelKey: "billPreset.shapeBlouseLining" },
  { id: "dress", groupId: "garments", labelKey: "billPreset.dress" },
  { id: "top", groupId: "garments", labelKey: "billPreset.top" },
  { id: "restitching", groupId: "garments", labelKey: "billPreset.restitching" },
  { id: "saree_falls", groupId: "saree_uniform", labelKey: "billPreset.sareeFalls" },
  { id: "saree_falls_mudulu", groupId: "saree_uniform", labelKey: "billPreset.sareeFallsMudulu" },
  { id: "hangings", groupId: "saree_uniform", labelKey: "billPreset.hangings" },
  { id: "school_uniform", groupId: "saree_uniform", labelKey: "billPreset.schoolUniform" },
];

export function billPresetItemsForGroup(groupId: BillPresetGroupId): BillPresetItem[] {
  return BILL_PRESET_ITEMS.filter((item) => item.groupId === groupId);
}

export function billPresetLabelKey(id: BillPresetItemId): string {
  return BILL_PRESET_ITEMS.find((item) => item.id === id)?.labelKey ?? id;
}
