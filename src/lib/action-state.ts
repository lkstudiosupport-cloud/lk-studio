export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const initialActionState: ActionState = { ok: false };
