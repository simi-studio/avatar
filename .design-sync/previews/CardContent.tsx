import { Card, CardHeader, CardTitle, CardContent, Label, Select } from "simi-avatar";

// CardContent is the body slot of a Card — its padding only reads correctly
// nested under a Card with a header above it.
export function InCard() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gap: 6 }}>
            <Label htmlFor="cc-provider">Image provider</Label>
            <Select id="cc-provider" defaultValue="openai">
              <option value="openai">OpenAI</option>
              <option value="minimax">MiniMax</option>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
