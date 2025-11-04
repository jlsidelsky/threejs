import { PRIMITIVE_INFO } from "@/constants/primitives";
import { Button } from "@/components/ui/button";
import { Box, Cylinder, Cone, Circle, Torus, Pyramid } from "lucide-react";

interface PrimitiveSelectorProps {
  onSelect: (primitiveType: string) => void;
}

// Map primitive types to Lucide icons
const PRIMITIVE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  box: Box,
  cylinder: Cylinder,
  cone: Cone,
  sphere: Circle,
  torus: Torus,
  pyramid: Pyramid,
};

export function PrimitiveSelector({ onSelect }: PrimitiveSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRIMITIVE_INFO.map((primitive) => {
        const Icon = PRIMITIVE_ICONS[primitive.type] || Box;
        return (
          <Button
            key={primitive.type}
            variant="outline"
            onClick={() => onSelect(primitive.type)}
            className="h-auto py-4 flex flex-col items-center gap-2"
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-medium">{primitive.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
