import type {
  Model,
  ModelNode,
  NodeId,
  PrimitiveType,
  Transform,
  AssemblyNode,
  PrimitiveNode,
} from "@/types/model";
import type { SelectionState } from "@/types/threejs";
import { generateId } from "@/utils/uuid";
import { DEFAULT_TRANSFORM } from "@/constants/primitives";
import {
  validateTreeMove,
  getDescendants,
  findParent,
} from "@/utils/treeUtils";
import { PRIMITIVE_DEFAULTS } from "@/constants/primitives";

export interface ModelState {
  model: Model;
  selection: SelectionState;
  history: ModelState[];
  historyIndex: number;
}

export type ModelAction =
  | {
      type: "ADD_PRIMITIVE";
      parentId: NodeId;
      primitiveType: PrimitiveType;
      name: string;
    }
  | { type: "ADD_ASSEMBLY"; parentId: NodeId; name: string }
  | { type: "DELETE_NODE"; nodeId: NodeId }
  | { type: "UPDATE_NODE"; nodeId: NodeId; updates: Partial<ModelNode> }
  | { type: "UPDATE_TRANSFORM"; nodeId: NodeId; transform: Partial<Transform> }
  | {
      type: "REORDER_CHILDREN";
      parentId: NodeId;
      fromIndex: number;
      toIndex: number;
    }
  | { type: "MOVE_NODE"; nodeId: NodeId; newParentId: NodeId }
  | { type: "SELECT_NODE"; nodeId: NodeId | null }
  | { type: "RENAME_NODE"; nodeId: NodeId; name: string }
  | { type: "TOGGLE_VISIBILITY"; nodeId: NodeId }
  | {
      type: "UPDATE_PRIMITIVE_PROPERTIES";
      nodeId: NodeId;
      properties: Partial<Record<string, number>>;
    }
  | { type: "DUPLICATE_NODE"; nodeId: NodeId }
  | { type: "UNDO" }
  | { type: "REDO" };

// Check if an action should be saved to history
function shouldSaveToHistory(action: ModelAction): boolean {
  // Don't save selection changes or undo/redo to history
  return (
    action.type !== "SELECT_NODE" &&
    action.type !== "UNDO" &&
    action.type !== "REDO"
  );
}

export function modelReducer(
  state: ModelState,
  action: ModelAction
): ModelState {
  // Handle undo/redo first
  if (action.type === "UNDO") {
    if (state.historyIndex > 0) {
      const previousState = state.history[state.historyIndex - 1];
      return {
        ...previousState,
        history: state.history,
        historyIndex: state.historyIndex - 1,
      };
    }
    return state; // Can't undo further
  }

  if (action.type === "REDO") {
    if (state.historyIndex < state.history.length - 1) {
      const nextState = state.history[state.historyIndex + 1];
      return {
        ...nextState,
        history: state.history,
        historyIndex: state.historyIndex + 1,
      };
    }
    return state; // Can't redo further
  }

  // Apply the action first
  let newState: ModelState;

  switch (action.type) {
    case "ADD_PRIMITIVE": {
      const newNodeId = generateId();
      const parent = state.model.nodes[action.parentId];

      if (parent.type !== "assembly") {
        newState = state; // Invalid parent
        break;
      }

      const newPrimitive: PrimitiveNode = {
        id: newNodeId,
        type: "primitive",
        name: action.name,
        primitiveType: action.primitiveType,
        properties: { ...PRIMITIVE_DEFAULTS[action.primitiveType] },
        transform: { ...DEFAULT_TRANSFORM },
        visible: true,
        color: "#ffffff", // Default white color
      };

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [newNodeId]: newPrimitive,
            [action.parentId]: {
              ...parent,
              children: [...parent.children, newNodeId],
            },
          },
        },
        selection: {
          ...state.selection,
          selectedNodeId: newNodeId,
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "ADD_ASSEMBLY": {
      const newNodeId = generateId();
      const parent = state.model.nodes[action.parentId];

      if (parent.type !== "assembly") {
        newState = state;
        break;
      }

      const newAssembly: AssemblyNode = {
        id: newNodeId,
        type: "assembly",
        name: action.name,
        transform: { ...DEFAULT_TRANSFORM },
        visible: true,
        children: [],
      };

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [newNodeId]: newAssembly,
            [action.parentId]: {
              ...parent,
              children: [...parent.children, newNodeId],
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "DELETE_NODE": {
      const node = state.model.nodes[action.nodeId];
      if (!node) {
        newState = state;
        break;
      }

      // Get all descendants
      const descendants = getDescendants(action.nodeId, state.model);
      const allIdsToDelete = [action.nodeId, ...descendants];

      // Remove from parent
      const parent = findParent(action.nodeId, state.model);
      if (parent) {
        const parentNode = state.model.nodes[parent];
        if (parentNode.type === "assembly") {
          const newChildren = parentNode.children.filter(
            (id) => id !== action.nodeId
          );
          const nodes = { ...state.model.nodes };

          // Delete node and all descendants
          allIdsToDelete.forEach((id) => delete nodes[id]);

          newState = {
            ...state,
            model: {
              ...state.model,
              nodes: {
                ...nodes,
                [parent]: {
                  ...parentNode,
                  children: newChildren,
                },
              },
            },
            selection:
              state.selection.selectedNodeId === action.nodeId
                ? { ...state.selection, selectedNodeId: null }
                : state.selection,
            history: state.history,
            historyIndex: state.historyIndex,
          };
          break;
        }
      }

      // If deleting root, we can't really do that, so just return state
      newState = state;
      break;
    }

    case "UPDATE_NODE": {
      const node = state.model.nodes[action.nodeId];
      if (!node) {
        newState = state;
        break;
      }

      // Create a new nodes object with the updated node
      const nodes = { ...state.model.nodes };
      nodes[action.nodeId] = {
        ...node,
        ...action.updates,
      } as ModelNode;

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes,
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "UPDATE_TRANSFORM": {
      const node = state.model.nodes[action.nodeId];
      if (!node) {
        newState = state;
        break;
      }

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [action.nodeId]: {
              ...node,
              transform: {
                ...node.transform,
                ...action.transform,
                position: {
                  ...node.transform.position,
                  ...(action.transform.position || {}),
                },
                rotation: {
                  ...node.transform.rotation,
                  ...(action.transform.rotation || {}),
                },
                scale: {
                  ...node.transform.scale,
                  ...(action.transform.scale || {}),
                },
              },
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "REORDER_CHILDREN": {
      const parent = state.model.nodes[action.parentId];
      if (parent.type !== "assembly") {
        newState = state;
        break;
      }

      const newChildren = [...parent.children];
      const [moved] = newChildren.splice(action.fromIndex, 1);
      newChildren.splice(action.toIndex, 0, moved);

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [action.parentId]: {
              ...parent,
              children: newChildren,
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "MOVE_NODE": {
      if (!validateTreeMove(action.nodeId, action.newParentId, state.model)) {
        newState = state;
        break;
      }

      const oldParent = findParent(action.nodeId, state.model);
      const newParent = state.model.nodes[action.newParentId];

      if (newParent.type !== "assembly") {
        newState = state;
        break;
      }

      const nodes = { ...state.model.nodes };

      // Remove from old parent
      if (oldParent) {
        const oldParentNode = nodes[oldParent];
        if (oldParentNode.type === "assembly") {
          nodes[oldParent] = {
            ...oldParentNode,
            children: oldParentNode.children.filter(
              (id) => id !== action.nodeId
            ),
          };
        }
      }

      // Add to new parent
      nodes[action.newParentId] = {
        ...newParent,
        children: [...newParent.children, action.nodeId],
      };

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes,
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "SELECT_NODE": {
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedNodeId: action.nodeId,
        },
      };
    }

    case "RENAME_NODE": {
      const node = state.model.nodes[action.nodeId];
      if (!node) {
        newState = state;
        break;
      }

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [action.nodeId]: {
              ...node,
              name: action.name,
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "TOGGLE_VISIBILITY": {
      const node = state.model.nodes[action.nodeId];
      if (!node) {
        newState = state;
        break;
      }

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [action.nodeId]: {
              ...node,
              visible: !node.visible,
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "UPDATE_PRIMITIVE_PROPERTIES": {
      const node = state.model.nodes[action.nodeId];
      if (!node || node.type !== "primitive") {
        newState = state;
        break;
      }

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: {
            ...state.model.nodes,
            [action.nodeId]: {
              ...node,
              properties: {
                ...node.properties,
                ...action.properties,
              },
            },
          },
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    case "DUPLICATE_NODE": {
      const node = state.model.nodes[action.nodeId];
      if (!node || action.nodeId === state.model.rootId) {
        newState = state;
        break;
      }

      const parent = findParent(action.nodeId, state.model);
      if (!parent) {
        newState = state;
        break;
      }

      const parentNode = state.model.nodes[parent];
      if (parentNode.type !== "assembly") {
        newState = state;
        break;
      }

      // Recursively duplicate node and all descendants
      const duplicateNode = (
        sourceId: NodeId,
        newParentId: NodeId,
        nodes: Record<NodeId, ModelNode>
      ): NodeId => {
        const sourceNode = nodes[sourceId];
        if (!sourceNode) return sourceId; // Safety check

        const newId = generateId();

        if (sourceNode.type === "primitive") {
          // Simple primitive - just duplicate it (including color)
          nodes[newId] = {
            ...sourceNode,
            id: newId,
            name: `${sourceNode.name} (copy)`,
            color: sourceNode.color, // Preserve color
          };
        } else {
          // Assembly - create it first with empty children
          nodes[newId] = {
            ...sourceNode,
            id: newId,
            name: `${sourceNode.name} (copy)`,
            children: [],
          };

          // Then duplicate all children recursively
          const newChildren: NodeId[] = [];
          for (const childId of sourceNode.children) {
            const duplicatedChildId = duplicateNode(childId, newId, nodes);
            newChildren.push(duplicatedChildId);
          }

          // Update the assembly with duplicated children
          const duplicatedAssembly = nodes[newId];
          if (duplicatedAssembly.type === "assembly") {
            nodes[newId] = {
              ...duplicatedAssembly,
              children: newChildren,
            };
          }
        }

        // Add to parent
        const newParentNode = nodes[newParentId];
        if (newParentNode && newParentNode.type === "assembly") {
          nodes[newParentId] = {
            ...newParentNode,
            children: [...newParentNode.children, newId],
          };
        }

        return newId;
      };

      const newNodes = { ...state.model.nodes };
      const duplicatedId = duplicateNode(action.nodeId, parent, newNodes);

      newState = {
        ...state,
        model: {
          ...state.model,
          nodes: newNodes,
        },
        selection: {
          ...state.selection,
          selectedNodeId: duplicatedId,
        },
        history: state.history,
        historyIndex: state.historyIndex,
      };
      break;
    }

    default:
      newState = state;
      break;
  }

  // Save resulting state to history after applying action (if needed)
  if (shouldSaveToHistory(action)) {
    // Remove any "future" history if we're not at the end
    const trimmedHistory = state.history.slice(0, state.historyIndex + 1);

    // Create a snapshot of the NEW state (after action) without history
    const stateSnapshot: ModelState = {
      model: {
        ...newState.model,
        nodes: JSON.parse(JSON.stringify(newState.model.nodes)),
      },
      selection: { ...newState.selection },
      history: [],
      historyIndex: -1,
    };

    // Add to history (max 50 entries)
    trimmedHistory.push(stateSnapshot);
    let finalHistoryIndex: number;
    if (trimmedHistory.length > 50) {
      trimmedHistory.shift(); // Remove oldest
      finalHistoryIndex = 49; // Max index is 49 after shift
    } else {
      finalHistoryIndex = trimmedHistory.length - 1;
    }

    // Update the newState with the new history
    newState = {
      ...newState,
      history: trimmedHistory,
      historyIndex: finalHistoryIndex,
    };
  }

  return newState;
}

// Initial state factory
export function createInitialState(): ModelState {
  const rootId = generateId();
  const rootNode: AssemblyNode = {
    id: rootId,
    type: "assembly",
    name: "Root",
    transform: { ...DEFAULT_TRANSFORM },
    visible: true,
    children: [],
  };

  const initialState: ModelState = {
    model: {
      rootId,
      nodes: {
        [rootId]: rootNode,
      },
    },
    selection: {
      selectedNodeId: null,
      hoveredNodeId: null,
    },
    history: [],
    historyIndex: -1,
  };

  // Save initial state to history as the first entry
  const initialSnapshot: ModelState = {
    model: {
      ...initialState.model,
      nodes: JSON.parse(JSON.stringify(initialState.model.nodes)),
    },
    selection: { ...initialState.selection },
    history: [],
    historyIndex: -1,
  };

  return {
    ...initialState,
    history: [initialSnapshot],
    historyIndex: 0,
  };
}
