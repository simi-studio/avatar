import { Textarea, Label } from "simi-avatar";

const field = { display: "grid", gap: 6, padding: 24, maxWidth: 380 };

export function WithLabel() {
  return (
    <div style={field}>
      <Label htmlFor="ta-prompt">Prompt</Label>
      <Textarea
        id="ta-prompt"
        rows={4}
        defaultValue="A couple in matching winter coats, golden-hour light, cinematic bokeh background."
      />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "grid", gap: 12, padding: 24, maxWidth: 380 }}>
      <Textarea placeholder="Describe the scene…" rows={3} />
      <Textarea defaultValue="Disabled draft" rows={3} disabled />
    </div>
  );
}
