import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useModel } from "@/store/ModelStore";
import { getChildren } from "@/utils/treeUtils";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Cylinder,
  Cone,
  Circle,
  Torus,
  Pyramid,
  Folder,
  GripVertical,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrimitiveType } from "@/types/model";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TreeNodeProps {
  nodeId: string;
  depth: number;
}

// Map primitive types to Lucide icons
const PRIMITIVE_ICONS: Record<
  PrimitiveType,
  React.ComponentType<{ className?: string }>
> = {
  box: Box,
  cylinder: Cylinder,
  cone: Cone,
  sphere: Circle,
  torus: Torus,
  pyramid: Pyramid,
};

export function TreeNode({ nodeId, depth }: TreeNodeProps) {
  const { state, dispatch } = useModel();
  const node = state.model.nodes[nodeId];
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const children = getChildren(nodeId, state.model);
  const isSelected = state.selection.selectedNodeId === nodeId;
  const isAssembly = node?.type === "assembly";
  const hasChildren = children.length > 0;

  // Get the appropriate icon for the primitive type
  const PrimitiveIcon =
    node?.type === "primitive"
      ? PRIMITIVE_ICONS[node.primitiveType] || Box
      : null;

  // Make assemblies droppable (including root)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-${nodeId}`,
    disabled: !isAssembly,
    data: {
      type: "assembly",
      nodeId,
    },
  });

  // Auto-expand when children are added (track previous children count)
  const prevChildrenCountRef = useRef(children.length);
  useEffect(() => {
    // If children count increased, expand the node
    if (children.length > prevChildrenCountRef.current && !isExpanded) {
      setIsExpanded(true);
    }
    prevChildrenCountRef.current = children.length;
  }, [children.length, isExpanded]);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: nodeId,
    disabled: nodeId === state.model.rootId, // Can't drag root
  });

  // Combine refs for both sortable and droppable
  const combinedRef = (element: HTMLDivElement | null) => {
    setSortableRef(element);
    if (isAssembly) {
      setDroppableRef(element);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!node) return null;

  const handleClick = () => {
    dispatch({ type: "SELECT_NODE", nodeId });
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleRename = () => {
    if (renameValue.trim() && node) {
      dispatch({ type: "RENAME_NODE", nodeId, name: renameValue.trim() });
      setShowRenameDialog(false);
      setRenameValue("");
    }
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node) {
      setRenameValue(node.name);
      setShowRenameDialog(true);
    }
  };

  // Check if this is a valid drop target (for visual feedback)
  const isValidDropTarget = isAssembly && isOver;

  return (
    <div
      ref={combinedRef}
      style={style}
      className={cn(
        "select-none",
        isDragging && "opacity-50",
        isValidDropTarget && "ring-2 ring-primary ring-offset-2 rounded"
      )}
    >
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent min-w-0",
          isSelected && "bg-accent",
          isValidDropTarget && "bg-primary/10",
          depth > 0 && "ml-4"
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        {/* Drag handle - only this is draggable */}
        {nodeId !== state.model.rootId && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-background rounded -ml-1 mr-0.5 opacity-50 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        {hasChildren ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 hover:bg-background rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : null}

        <div
          onClick={handleClick}
          className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden"
        >
          {isAssembly ? (
            <Folder className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : PrimitiveIcon ? (
            <PrimitiveIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Box className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          <span className="text-sm truncate min-w-0 flex-1">{node.name}</span>
          {!node.visible && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              (hidden)
            </span>
          )}
        </div>

        {/* Action buttons */}
        {nodeId !== state.model.rootId && (
          <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Visibility toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: "TOGGLE_VISIBILITY", nodeId });
              }}
              title={node.visible ? "Hide" : "Show"}
            >
              {node.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>

            {/* Context menu button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onClick={handleRenameClick}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "DUPLICATE_NODE", nodeId });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: "DELETE_NODE", nodeId });
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              Rename {node?.type === "assembly" ? "Assembly" : "Primitive"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rename-input">Name</Label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename();
                  }
                  if (e.key === "Escape") {
                    setShowRenameDialog(false);
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setRenameValue("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isExpanded && hasChildren && (
        <div>
          {children.map((childId) => (
            <TreeNode key={childId} nodeId={childId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
