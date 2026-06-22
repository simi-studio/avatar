import { Card, CardHeader, CardTitle, CardContent, Button, Label, Input } from "simi-avatar";

const pad = { padding: 24, maxWidth: 380 };

export function GenerationSettings() {
  return (
    <div style={pad}>
      <Card>
        <CardHeader>
          <CardTitle>Generation settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <Label htmlFor="card-prompt">Prompt</Label>
              <Input id="card-prompt" defaultValue="Studio portrait, soft light" />
            </div>
            <Button>Generate avatar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResultCard() {
  return (
    <div style={pad}>
      <Card>
        <CardHeader>
          <CardTitle>Your avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 8,
              background:
                "linear-gradient(135deg, hsl(187 84% 31%), hsl(187 55% 72%))",
              display: "flex",
              alignItems: "flex-end",
              padding: 12,
              color: "white",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            themed · couple
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
