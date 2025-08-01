import { Input } from "./ui/input";
import { Label } from "./ui/label";

function SeedSetting({
  label,
  value,
  onChange,
  generateRandom,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  generateRandom: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between">
        <Label>{label}</Label>
        <button onClick={generateRandom}>🎲</button>
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export { SeedSetting };
