export const roles = [
  "owner",
  "admin",
  "gestor",
  "social_media",
  "designer",
  "editor",
  "financeiro",
] as const;
export type Role = (typeof roles)[number];
export const roleLabels: Record<Role, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  gestor: "Gestor",
  social_media: "Social media",
  designer: "Designer",
  editor: "Editor",
  financeiro: "Financeiro",
};
export const canReadFinance = (role: Role) =>
  ["owner", "admin", "financeiro"].includes(role);
export const canReadCommercial = (role: Role) =>
  ["owner", "admin", "gestor"].includes(role);
export const canReadOperations = (role: Role) => role !== "financeiro";
