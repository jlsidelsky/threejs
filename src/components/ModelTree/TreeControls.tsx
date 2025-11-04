import { useState } from "react";
import { useModel } from "@/store/ModelStore";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, FolderPlus } from "lucide-react";
import { PrimitiveSelector } from "@/components/PrimitiveSelector/PrimitiveSelector";
import { findParent } from "@/utils/treeUtils";
import {
  getNextPrimitiveName,
  getNextAssemblyName,
} from "@/utils/nameGenerator";

export function TreeControls() {
  const { state, dispatch } = useModel();
  const [showPrimitivePopover, setShowPrimitivePopover] = useState(false);

  // Get the parent ID - if selected node is an assembly, use it; otherwise use its parent or root
  const selectedNodeId = state.selection.selectedNodeId || state.model.rootId;
  const selectedNode = state.model.nodes[selectedNodeId];
  let parentId = state.model.rootId;

  if (selectedNode) {
    if (selectedNode.type === "assembly") {
      parentId = selectedNodeId;
    } else {
      // If selected node is a primitive, find its parent or use root
      const parent = findParent(selectedNodeId, state.model);
      parentId = parent || state.model.rootId;
    }
  }

  const handleAddPrimitive = (primitiveType: string) => {
    const name = getNextPrimitiveName(state.model, primitiveType as any);
    dispatch({
      type: "ADD_PRIMITIVE",
      parentId,
      primitiveType: primitiveType as any,
      name,
    });
    setShowPrimitivePopover(false);
  };

  const handleAddAssembly = () => {
    const name = getNextAssemblyName(state.model);
    dispatch({
      type: "ADD_ASSEMBLY",
      parentId,
      name,
    });
  };

  return (
    <div className="p-2 flex gap-2">
      <Popover
        open={showPrimitivePopover}
        onOpenChange={setShowPrimitivePopover}
      >
        <PopoverTrigger asChild>
          <Button size="sm" variant="default" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Add Primitive
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <PrimitiveSelector onSelect={handleAddPrimitive} />
        </PopoverContent>
      </Popover>

      <Button
        size="sm"
        variant="outline"
        onClick={handleAddAssembly}
        className="flex-1"
      >
        <FolderPlus className="w-4 h-4 mr-2" />
        Add Assembly
      </Button>
    </div>
  );
}
