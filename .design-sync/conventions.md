# Simi Avatar UI — building with this design system

Exports (on `window.SimiAvatar`): **Button, Card, CardHeader, CardTitle, CardContent, Input, Label, Select, Textarea**. They are thin React wrappers over native HTML elements (`button`, `input`, `select`, `textarea`, `div`) — fully styled out of the box and forwarding all native props + `ref`. Render the real exports; never hand-roll lookalikes.

## Setup / theming

No provider or context wrapper is needed. All styling comes from the single stylesheet **`styles.css`** (it `@import`s the compiled component CSS `_ds_bundle.css` plus the design tokens). Load that one file.

- Tokens are CSS custom properties on `:root`. **Light is the default.**
- **Dark theme:** add `class="dark"` to any ancestor element — every token flips to its dark value under the `.dark` selector. Theming is pure CSS; there is no JS theme state.

## Styling idiom — token CSS variables (the reliable vocabulary)

The design language is a set of HSL tokens. Use them as `hsl(var(--token))`, or `hsl(var(--token) / <alpha>)` for opacity. These are always defined, in both light and dark:

| Token (`--…`) | Role |
|---|---|
| `background` / `foreground` | page surface + body text |
| `card` / `card-foreground` | raised surface (Card) |
| `primary` / `primary-foreground` | brand action — teal |
| `secondary` / `secondary-foreground` | muted action |
| `muted` / `muted-foreground` | subtle surface + secondary text |
| `accent` / `accent-foreground` | hover / highlight |
| `destructive` / `destructive-foreground` | danger / delete |
| `border`, `input` | hairlines + field borders |
| `ring` | focus ring |
| `radius` | base corner radius (`rounded-lg` = `var(--radius)`) |

**IMPORTANT — not a full Tailwind build.** The shipped `_ds_bundle.css` is a *compiled subset*: only the utility classes these components already use are present (e.g. `bg-primary`, `bg-card`, `border-input`, `rounded-lg`, `text-muted-foreground`). An arbitrary class like `bg-muted`, `p-8`, or `gap-4` will **not** resolve. For your own layout/markup, style with the **token variables above** (inline `style` or your own CSS) so it matches the components in both themes — that is exactly how the bundled previews are built.

## Where the truth lives

- **`styles.css`** (and its `@import`ed `_ds_bundle.css`) — the one stylesheet to load; read it for the full token list and the exact component classes.
- **`components/general/<Name>/<Name>.d.ts`** — the prop contract (native element props + `ref`; `Button` adds `variant`, `size`, `asChild`).
- **`components/general/<Name>/<Name>.prompt.md`** — per-component usage notes.

`Button` variants: `default | secondary | outline | ghost | destructive | link`; sizes: `default | sm | lg | icon`. `Select` takes native `<option>` children.

## Idiomatic example

```tsx
import { Card, CardHeader, CardTitle, CardContent, Label, Input, Select, Button } from "simi-avatar";

<Card>
  <CardHeader><CardTitle>Generation settings</CardTitle></CardHeader>
  <CardContent>
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <Label htmlFor="prompt">Prompt</Label>
        <Input id="prompt" placeholder="Describe your avatar…" />
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <Label htmlFor="mode">Mode</Label>
        <Select id="mode" defaultValue="themed">
          <option value="single">Single</option>
          <option value="couple">Couple</option>
          <option value="themed">Themed</option>
        </Select>
      </div>
      <Button>Generate avatar</Button>
    </div>
  </CardContent>
</Card>
```
