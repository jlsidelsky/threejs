import type { PrimitiveType, BasePrimitiveProps } from "./model";

// Re-export for convenience
export type { PrimitiveType, BasePrimitiveProps };

// Primitive metadata for UI
export interface PrimitiveInfo {
  type: PrimitiveType;
  label: string;
  icon?: string;
  defaultProperties: BasePrimitiveProps;
}
