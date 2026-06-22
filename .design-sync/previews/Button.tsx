import { Button } from "simi-avatar";

const row = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 12,
  alignItems: "center",
  padding: 24,
};

export function Variants() {
  return (
    <div style={row}>
      <Button>Generate avatar</Button>
      <Button variant="secondary">Save preset</Button>
      <Button variant="outline">Upload photo</Button>
      <Button variant="ghost">Reset</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">View gallery</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={row}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Generate avatar</Button>
      <Button size="icon" aria-label="Generate">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18M3 12h18" />
        </svg>
      </Button>
    </div>
  );
}

export function States() {
  return (
    <div style={row}>
      <Button>Enabled</Button>
      <Button disabled>Generating…</Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </div>
  );
}
