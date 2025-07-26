import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

function SliderSetting({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        <Label htmlFor="email">{label}</Label>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(value) => onChange(value[0])}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

export { SliderSetting };
