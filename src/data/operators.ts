import type { OperatorBrand, OperatorId } from "../types";

export const OPERATORS: OperatorBrand[] = [
  {
    id: "generic",
    name: "Your Operator",
    shortName: "Operator",
    productName: "SMB AI Receptionist",
    tagline: "An always-on AI receptionist operators can offer their SMB customers.",
  },
];

export const DEFAULT_OPERATOR: OperatorId = "generic";

export function getOperator(id: OperatorId): OperatorBrand {
  return OPERATORS.find((o) => o.id === id) ?? OPERATORS[0];
}
