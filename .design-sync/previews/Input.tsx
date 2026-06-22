import { Input, Label } from "simi-avatar";

const field = { display: "grid", gap: 6, padding: 24, maxWidth: 340 };

export function WithLabel() {
  return (
    <div style={field}>
      <Label htmlFor="in-prompt">Prompt</Label>
      <Input id="in-prompt" placeholder="Describe your avatar…" />
    </div>
  );
}

export function ApiKey() {
  return (
    <div style={field}>
      <Label htmlFor="in-key">API key</Label>
      <Input id="in-key" type="password" defaultValue="example-api-key" />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "grid", gap: 12, padding: 24, maxWidth: 340 }}>
      <Input placeholder="Empty" />
      <Input defaultValue="Filled value" />
      <Input defaultValue="Disabled" disabled />
    </div>
  );
}
