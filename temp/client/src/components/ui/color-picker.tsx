import { useState, useEffect } from "react";
import { useLocale } from "@/contexts/locale-context";

interface ColorOption {
  hex: string;
  label?: string;
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  options?: ColorOption[];
  label?: string;
}

export function ColorPicker({
  value,
  onChange,
  options = [
    { hex: "#e65100" },
    { hex: "#2196f3" },
    { hex: "#4caf50" },
    { hex: "#9c27b0" },
    { hex: "#f44336" },
  ],
  label,
}: ColorPickerProps) {
  const { t } = useLocale();
  const [selectedColor, setSelectedColor] = useState<string>(value);

  useEffect(() => {
    setSelectedColor(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-neutral-500">{label}</span>
        </div>
      )}
      <div className="flex space-x-2 rtl:space-x-reverse">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={`w-6 h-6 rounded-full ${
              selectedColor === option.hex ? "ring-2 ring-offset-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: option.hex }}
            onClick={() => handleColorChange(option.hex)}
            title={option.label || option.hex}
            aria-label={option.label || `Color ${option.hex}`}
          />
        ))}
      </div>
    </div>
  );
}
