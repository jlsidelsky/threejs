import type { NodeId } from "./model";
import type * as THREE from "three";

// Maps model nodes to Three.js objects
export interface ThreeObjectMap {
  [nodeId: NodeId]: THREE.Object3D;
}

// Selection state
export interface SelectionState {
  selectedNodeId: NodeId | null;
  hoveredNodeId: NodeId | null;
}
