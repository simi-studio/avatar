import { Card, CardHeader, CardTitle, CardContent } from "simi-avatar";

// CardTitle is the heading slot inside a CardHeader — shown in context.
export function InCard() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <Card>
        <CardHeader>
          <CardTitle>Generation history</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ margin: 0, fontSize: 14, color: "hsl(220 10% 40%)" }}>
            Your last 12 avatars, kept only in this browser session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
