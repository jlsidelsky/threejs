// Unique identifier for nodes
export type NodeId = string;

// Geometric primitive types
export type PrimitiveType =
  | "box"
  | "cylinder"
  | "cone"
  | "sphere"
  | "torus"
  | "pyramid";

// Base properties for all primitives
export interface BasePrimitiveProps {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  tube?: number;
  segments?: number;
  [key: string]: number | undefined;
}

// Transform in 3D space
export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // in radians
  scale: { x: number; y: number; z: number };
}

// Base node in hierarchy
export interface BaseNode {
  id: NodeId;
  name: string;
  transform: Transform;
  visible: boolean;
}

// Leaf node - actual geometric primitive
export interface PrimitiveNode extends BaseNode {
  type: "primitive";
  primitiveType: PrimitiveType;
  properties: BasePrimitiveProps;
  color?: string; // Hex color string (e.g., "#3b82f6")
}

// Container node - holds subassemblies
export interface AssemblyNode extends BaseNode {
  type: "assembly";
  children: NodeId[];
}

export type ModelNode = PrimitiveNode | AssemblyNode;

// Root model structure
export interface Model {
  rootId: NodeId;
  nodes: Record<NodeId, ModelNode>;
}
