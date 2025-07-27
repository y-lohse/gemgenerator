import { Label } from "./ui/label";
import { Toggle } from "./ui/toggle";

function ToggleSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        <Label htmlFor="email">{label}</Label>
        <Toggle onPressedChange={onChange}>{value ? "on" : "off"}</Toggle>
      </div>
    </div>
  );
}

export { ToggleSetting };
