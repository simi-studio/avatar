import { Label, Input, Select } from "simi-avatar";

const field = { display: "grid", gap: 6, padding: 24, maxWidth: 340 };

export function ForInput() {
  return (
    <div style={field}>
      <Label htmlFor="lbl-name">Display name</Label>
      <Input id="lbl-name" defaultValue="Ada" />
    </div>
  );
}

export function ForSelect() {
  return (
    <div style={field}>
      <Label htmlFor="lbl-mode">Mode</Label>
      <Select id="lbl-mode" defaultValue="themed">
        <option value="single">Single</option>
        <option value="couple">Couple</option>
        <option value="themed">Themed</option>
      </Select>
    </div>
  );
}
