import type { PrimitiveType, BasePrimitiveProps } from "@/types/model";
import type { PrimitiveInfo } from "@/types/primitives";

export const PRIMITIVE_DEFAULTS: Record<PrimitiveType, BasePrimitiveProps> = {
  box: { width: 1, height: 1, depth: 1 },
  cylinder: { radius: 0.5, height: 1, segments: 32 },
  cone: { radius: 0.5, height: 1, segments: 32 },
  sphere: { radius: 0.5, segments: 32 },
  torus: { radius: 0.5, tube: 0.2, segments: 32 },
  pyramid: { width: 1, height: 1, depth: 1 },
};

export const PRIMITIVE_INFO: PrimitiveInfo[] = [
  {
    type: "box",
    label: "Box",
    defaultProperties: PRIMITIVE_DEFAULTS.box,
  },
  {
    type: "cylinder",
    label: "Cylinder",
    defaultProperties: PRIMITIVE_DEFAULTS.cylinder,
  },
  {
    type: "cone",
    label: "Cone",
    defaultProperties: PRIMITIVE_DEFAULTS.cone,
  },
  {
    type: "sphere",
    label: "Sphere",
    defaultProperties: PRIMITIVE_DEFAULTS.sphere,
  },
  {
    type: "torus",
    label: "Torus",
    defaultProperties: PRIMITIVE_DEFAULTS.torus,
  },
  {
    type: "pyramid",
    label: "Pyramid",
    defaultProperties: PRIMITIVE_DEFAULTS.pyramid,
  },
];

export const DEFAULT_TRANSFORM = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
} as const;
