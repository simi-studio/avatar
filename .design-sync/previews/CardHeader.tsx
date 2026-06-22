import { Card, CardHeader, CardTitle, CardContent } from "simi-avatar";

// CardHeader renders inside a Card — the only composition where its spacing
// and divider context read true.
export function InCard() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Theme presets</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0, fontSize: 14, color: "hsl(220 10% 40%)" }}>
            Pick a curated look or save your own.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
