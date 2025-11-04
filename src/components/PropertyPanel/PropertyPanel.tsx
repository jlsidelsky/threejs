import { useState } from "react";
import { useModel } from "@/store/ModelStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PanelLeft, PanelRight, Link2, Unlink2 } from "lucide-react";
import { PropertyInput } from "./PropertyInput";
import { cn } from "@/lib/utils";
import type { PrimitiveType, BasePrimitiveProps } from "@/types/model";

export function PropertyPanel() {
  const { state, dispatch } = useModel();
  const selectedNodeId = state.selection.selectedNodeId;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Track which transform fields are linked (maintaining ratios)
  const [linkedFields, setLinkedFields] = useState<Set<string>>(new Set());

  // Helper to get size values from primitive properties (for display)
  const getPrimitiveSize = (
    primitiveType: PrimitiveType,
    properties: BasePrimitiveProps
  ) => {
    switch (primitiveType) {
      case "box":
      case "pyramid":
        return {
          x: properties.width ?? 1,
          y: properties.height ?? 1,
          z: properties.depth ?? 1,
        };
      case "cylinder":
      case "cone": {
        const radius = properties.radius ?? 0.5;
        return {
          x: radius * 2,
          y: properties.height ?? 1,
          z: radius * 2,
        };
      }
      case "sphere": {
        const sphereRadius = properties.radius ?? 0.5;
        return {
          x: sphereRadius * 2,
          y: sphereRadius * 2,
          z: sphereRadius * 2,
        };
      }
      case "torus": {
        const torusRadius = properties.radius ?? 0.5;
        const tube = properties.tube ?? 0.2;
        return {
          x: (torusRadius + tube) * 2,
          y: tube * 2,
          z: (torusRadius + tube) * 2,
        };
      }
      default:
        return { x: 1, y: 1, z: 1 };
    }
  };

  // Helper to update primitive properties from size values
  const updatePrimitiveFromSize = (
    primitiveType: PrimitiveType,
    _size: { x: number; y: number; z: number },
    currentProperties: BasePrimitiveProps,
    isLinked: boolean,
    axis: "x" | "y" | "z",
    value: number
  ): BasePrimitiveProps => {
    const currentSize = getPrimitiveSize(primitiveType, currentProperties);
    let newSize = { ...currentSize };

    if (isLinked) {
      const oldValue = currentSize[axis];
      if (Math.abs(oldValue) < 0.0001) {
        newSize = { x: value, y: value, z: value };
      } else {
        const ratio = value / oldValue;
        newSize = {
          x: currentSize.x * ratio,
          y: currentSize.y * ratio,
          z: currentSize.z * ratio,
        };
      }
    } else {
      newSize[axis] = value;
    }

    // Convert size back to primitive properties
    switch (primitiveType) {
      case "box":
      case "pyramid":
        return {
          ...currentProperties,
          width: newSize.x,
          height: newSize.y,
          depth: newSize.z,
        };
      case "cylinder":
      case "cone":
        return {
          ...currentProperties,
          radius: newSize.x / 2, // Average of x and z (they should be equal)
          height: newSize.y,
        };
      case "sphere":
        return {
          ...currentProperties,
          radius: newSize.x / 2, // All axes should be equal
        };
      case "torus": {
        // For torus, X and Z represent outer diameter, Y represents tube diameter
        const outerRadius = Math.min(newSize.x, newSize.z) / 2;
        return {
          ...currentProperties,
          radius: outerRadius - newSize.y / 4, // Approximate
          tube: newSize.y / 2,
        };
      }
      default:
        return currentProperties;
    }
  };

  // Hide panel completely when nothing is selected or root is selected
  if (!selectedNodeId || selectedNodeId === state.model.rootId) {
    return null;
  }

  const node = state.model.nodes[selectedNodeId];
  if (!node) return null;

  const handleNameChange = (name: string) => {
    dispatch({ type: "RENAME_NODE", nodeId: selectedNodeId, name });
  };

  // Normalize angle to -180 to 180 degrees
  const normalizeAngle = (degrees: number): number => {
    let normalized = degrees % 360;
    if (normalized > 180) {
      normalized -= 360;
    } else if (normalized < -180) {
      normalized += 360;
    }
    return normalized;
  };

  const toggleLink = (field: "position" | "rotation" | "scale" | "size") => {
    const fieldKey = field;
    const newLinkedFields = new Set(linkedFields);
    if (newLinkedFields.has(fieldKey)) {
      newLinkedFields.delete(fieldKey);
    } else {
      newLinkedFields.add(fieldKey);
    }
    setLinkedFields(newLinkedFields);
  };

  const handleTransformChange = (
    field: "position" | "rotation" | "scale",
    axis: "x" | "y" | "z",
    value: number
  ) => {
    const isLinked = linkedFields.has(field);
    const current = node.transform[field];

    // Convert degrees to radians for rotation field, and normalize angle to -180 to 180
    const convertValue =
      field === "rotation"
        ? (val: number) => (normalizeAngle(val) * Math.PI) / 180
        : (val: number) => val;
    const actualValue = convertValue(value);

    if (isLinked) {
      // For linked fields, maintain ratio across x, y, z
      const oldValue = current[axis];
      // Avoid division by zero - if old value is 0, set all to new value
      if (Math.abs(oldValue) < 0.0001) {
        const newTransform = {
          x: actualValue,
          y: actualValue,
          z: actualValue,
        };
        dispatch({
          type: "UPDATE_TRANSFORM",
          nodeId: selectedNodeId,
          transform: {
            [field]: newTransform,
          },
        });
      } else {
        const ratio = actualValue / oldValue;
        const newTransform = {
          x: current.x * ratio,
          y: current.y * ratio,
          z: current.z * ratio,
        };
        dispatch({
          type: "UPDATE_TRANSFORM",
          nodeId: selectedNodeId,
          transform: {
            [field]: newTransform,
          },
        });
      }
    } else {
      // Normal update - only change the specific axis
      dispatch({
        type: "UPDATE_TRANSFORM",
        nodeId: selectedNodeId,
        transform: {
          [field]: {
            ...current,
            [axis]: actualValue,
          },
        },
      });
    }
  };

  const handleSizeChange = (axis: "x" | "y" | "z", value: number) => {
    if (node.type !== "primitive") return;

    const isLinked = linkedFields.has("size");
    const newProperties = updatePrimitiveFromSize(
      node.primitiveType,
      getPrimitiveSize(node.primitiveType, node.properties),
      node.properties,
      isLinked,
      axis,
      value
    );

    dispatch({
      type: "UPDATE_PRIMITIVE_PROPERTIES",
      nodeId: selectedNodeId,
      properties: newProperties,
    });
  };

  return (
    <div
      className={cn(
        "absolute top-4 right-4 bg-background border rounded-lg shadow-lg flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-10",
        isCollapsed ? "h-auto w-44" : "bottom-4 w-80"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between gap-2 whitespace-nowrap">
        <h2 className="text-lg font-semibold flex-shrink-0">Properties</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelRight className="w-4 h-4" />
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={node.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="h-8 text-sm bg-muted/70 border border-transparent hover:border-input focus-visible:border-input transition-colors"
              />
            </div>

            <Separator />

            {/* Transform */}
            <div className="space-y-6">
              <Label>Transform</Label>

              {/* Position */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Position
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleLink("position")}
                    title={
                      linkedFields.has("position") ? "Unlink axes" : "Link axes"
                    }
                  >
                    {linkedFields.has("position") ? (
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Unlink2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <PropertyInput
                    label="X"
                    value={node.transform.position.x}
                    onChange={(v) => handleTransformChange("position", "x", v)}
                    axis="x"
                  />
                  <PropertyInput
                    label="Y"
                    value={node.transform.position.y}
                    onChange={(v) => handleTransformChange("position", "y", v)}
                    axis="y"
                  />
                  <PropertyInput
                    label="Z"
                    value={node.transform.position.z}
                    onChange={(v) => handleTransformChange("position", "z", v)}
                    axis="z"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Rotation
                  </Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => toggleLink("rotation")}
                    title={
                      linkedFields.has("rotation") ? "Unlink axes" : "Link axes"
                    }
                  >
                    {linkedFields.has("rotation") ? (
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Unlink2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <PropertyInput
                    label="X"
                    value={normalizeAngle(
                      (node.transform.rotation.x * 180) / Math.PI
                    )}
                    onChange={(v) => handleTransformChange("rotation", "x", v)}
                    axis="x"
                  />
                  <PropertyInput
                    label="Y"
                    value={normalizeAngle(
                      (node.transform.rotation.y * 180) / Math.PI
                    )}
                    onChange={(v) => handleTransformChange("rotation", "y", v)}
                    axis="y"
                  />
                  <PropertyInput
                    label="Z"
                    value={normalizeAngle(
                      (node.transform.rotation.z * 180) / Math.PI
                    )}
                    onChange={(v) => handleTransformChange("rotation", "z", v)}
                    axis="z"
                  />
                </div>
              </div>

              {/* Scale (for assemblies) */}
              {node.type === "assembly" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Scale
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleLink("scale")}
                      title={
                        linkedFields.has("scale") ? "Unlink axes" : "Link axes"
                      }
                    >
                      {linkedFields.has("scale") ? (
                        <Link2 className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Unlink2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <PropertyInput
                      label="X"
                      value={node.transform.scale.x}
                      onChange={(v) => handleTransformChange("scale", "x", v)}
                      axis="x"
                    />
                    <PropertyInput
                      label="Y"
                      value={node.transform.scale.y}
                      onChange={(v) => handleTransformChange("scale", "y", v)}
                      axis="y"
                    />
                    <PropertyInput
                      label="Z"
                      value={node.transform.scale.z}
                      onChange={(v) => handleTransformChange("scale", "z", v)}
                      axis="z"
                    />
                  </div>
                </div>
              )}

              {/* Size (for primitives) */}
              {node.type === "primitive" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Size
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleLink("size")}
                      title={
                        linkedFields.has("size") ? "Unlink axes" : "Link axes"
                      }
                    >
                      {linkedFields.has("size") ? (
                        <Link2 className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Unlink2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <PropertyInput
                      label="X"
                      value={
                        getPrimitiveSize(node.primitiveType, node.properties).x
                      }
                      onChange={(v) => handleSizeChange("x", v)}
                      axis="x"
                    />
                    <PropertyInput
                      label="Y"
                      value={
                        getPrimitiveSize(node.primitiveType, node.properties).y
                      }
                      onChange={(v) => handleSizeChange("y", v)}
                      axis="y"
                    />
                    <PropertyInput
                      label="Z"
                      value={
                        getPrimitiveSize(node.primitiveType, node.properties).z
                      }
                      onChange={(v) => handleSizeChange("z", v)}
                      axis="z"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Color (only for primitives) */}
            {node.type === "primitive" && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={node.color || "#ffffff"}
                      onChange={(e) => {
                        dispatch({
                          type: "UPDATE_NODE",
                          nodeId: selectedNodeId,
                          updates: { color: e.target.value },
                        });
                      }}
                      className="h-8 w-8 rounded border border-input bg-muted/70 cursor-pointer"
                    />
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        type="text"
                        value={(node.color || "#ffffff").replace("#", "")}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Validate hex color format (without #)
                          if (/^[0-9A-Fa-f]{0,6}$/.test(value)) {
                            const hexValue =
                              value.length > 0 ? `#${value}` : "#ffffff";
                            dispatch({
                              type: "UPDATE_NODE",
                              nodeId: selectedNodeId,
                              updates: { color: hexValue },
                            });
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure valid hex color on blur
                          const value = e.target.value;
                          if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
                            // Reset to default if invalid
                            dispatch({
                              type: "UPDATE_NODE",
                              nodeId: selectedNodeId,
                              updates: { color: "#ffffff" },
                            });
                          } else if (value.length > 0) {
                            // Ensure # is added
                            dispatch({
                              type: "UPDATE_NODE",
                              nodeId: selectedNodeId,
                              updates: { color: `#${value}` },
                            });
                          }
                        }}
                        placeholder="ffffff"
                        className="h-8 text-sm bg-muted/70 border border-transparent hover:border-input focus-visible:border-input transition-colors flex-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
