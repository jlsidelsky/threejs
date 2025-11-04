import { useState } from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useModel } from "@/store/ModelStore";

import { TreeNode } from "./TreeNode";
import { TreeControls } from "./TreeControls";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight } from "lucide-react";
import { findParent, validateTreeMove } from "@/utils/treeUtils";
import { cn } from "@/lib/utils";

export function ModelTree() {
  const { state, dispatch } = useModel();
  const rootId = state.model.rootId;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    let overId: string;

    // Check if we're over a droppable (drop- prefix) or a sortable node
    if (typeof over.id === "string" && over.id.startsWith("drop-")) {
      // Dropping directly onto an assembly
      overId = over.id.replace("drop-", "");
    } else {
      // Dropping on a node - check if it's an assembly or we need to use its parent for reordering
      overId = over.id as string;
    }

    // First, check if we're dropping onto an assembly (moving to new parent)
    const overNode = state.model.nodes[overId];

    if (overNode && overNode.type === "assembly") {
      const activeParent = findParent(activeId, state.model);

      // Only move if we're actually changing parents
      if (activeParent !== overId) {
        // Validate the move (prevent circular references)
        if (validateTreeMove(activeId, overId, state.model)) {
          dispatch({
            type: "MOVE_NODE",
            nodeId: activeId,
            newParentId: overId,
          });
          return;
        }
      }
    }

    // Otherwise, handle reordering within same parent
    // (only if both nodes have the same parent and we're not dropping on the parent itself)
    const activeParent = findParent(activeId, state.model);
    const overParent = findParent(overId, state.model);

    if (
      activeParent &&
      overParent &&
      activeParent === overParent &&
      activeParent !== overId &&
      overId !== activeParent
    ) {
      const parentNode = state.model.nodes[activeParent];
      if (parentNode && parentNode.type === "assembly") {
        const children = parentNode.children;
        const fromIndex = children.indexOf(activeId);
        const toIndex = children.indexOf(overId);

        if (fromIndex !== -1 && toIndex !== -1) {
          dispatch({
            type: "REORDER_CHILDREN",
            parentId: activeParent,
            fromIndex,
            toIndex,
          });
        }
      }
    }
  };

  // Get all sortable items (all nodes except root)
  const allSortableIds = Object.keys(state.model.nodes).filter(
    (id) => id !== rootId
  );

  return (
    <div
      className={cn(
        "absolute top-4 left-4 bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-10",
        isCollapsed ? "h-auto w-52" : "h-auto w-80 max-h-[calc(100vh-2rem)]"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between gap-2 whitespace-nowrap">
        <h2 className="text-lg font-semibold flex-shrink-0">Model Tree</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelRight className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <>
          <TreeControls />
          <Separator />
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="p-2">
                <SortableContext
                  items={allSortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <TreeNode nodeId={rootId} depth={0} />
                </SortableContext>
              </div>
            </DndContext>
          </div>
        </>
      )}
    </div>
  );
}
