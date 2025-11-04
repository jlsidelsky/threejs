import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  axis?: "x" | "y" | "z";
}

export function PropertyInput({
  label,
  value,
  onChange,
  axis,
}: PropertyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // const [isDragging, setIsDragging] = useState(false);

  // Format value for display: always show 2 decimal places
  const formatValue = (val: number): string => {
    // Round to 2 decimal places and format with 2 decimal places
    const rounded = Math.round(val * 100) / 100;
    return rounded.toFixed(2);
  };

  // Initialize and update display value when value prop changes (e.g., from dragging)
  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatValue(value)
  );

  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleLabelMouseDown = (e: React.MouseEvent<HTMLLabelElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();

    const startX = e.clientX;
    const startValue = value;
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;

      // Start dragging only after 3px movement
      if (Math.abs(deltaX) > 3 && !hasMoved) {
        hasMoved = true;
        // setIsDragging(true);
      }

      if (hasMoved) {
        // Sensitivity: 1 pixel = 0.1 units by default, 0.01 with Shift for fine control
        const sensitivity = e.shiftKey ? 0.01 : 0.1;
        const deltaValue = deltaX * sensitivity;
        const newValue = startValue + deltaValue;

        onChange(newValue);
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      // setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="space-y-1">
      <Label
        onMouseDown={axis ? handleLabelMouseDown : undefined}
        className={cn(
          "text-xs",
          axis === "x" && "text-red-600 dark:text-red-400",
          axis === "y" && "text-green-600 dark:text-green-400",
          axis === "z" && "text-blue-600 dark:text-blue-400",
          !axis && "text-muted-foreground",
          axis && "cursor-ew-resize select-none"
        )}
      >
        {label}
      </Label>
      <Input
        ref={inputRef}
        type="text"
        value={displayValue}
        onFocus={handleFocus}
        onChange={(e) => {
          const inputValue = e.target.value;
          setDisplayValue(inputValue);

          // Allow empty input while typing
          if (inputValue === "" || inputValue === "-") {
            return;
          }

          const numValue = parseFloat(inputValue);
          if (!isNaN(numValue)) {
            onChange(numValue);
          }
        }}
        onBlur={(e) => {
          // Format on blur
          const numValue = parseFloat(e.target.value);
          if (!isNaN(numValue)) {
            setDisplayValue(formatValue(numValue));
          } else {
            // If invalid, revert to last valid value
            setDisplayValue(formatValue(value));
          }
        }}
        className={cn(
          "h-8 text-sm bg-muted/70 border border-transparent hover:border-input focus-visible:border-input transition-colors"
        )}
      />
    </div>
  );
}
