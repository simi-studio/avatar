import { Select, Label } from "simi-avatar";

const field = { display: "grid", gap: 6, padding: 24, maxWidth: 340 };

export function Provider() {
  return (
    <div style={field}>
      <Label htmlFor="sel-provider">Image provider</Label>
      <Select id="sel-provider" defaultValue="openai">
        <option value="openai">OpenAI</option>
        <option value="minimax">MiniMax (Global)</option>
        <option value="minimax-cn">MiniMax (China)</option>
      </Select>
    </div>
  );
}

export function Mode() {
  return (
    <div style={field}>
      <Label htmlFor="sel-mode">Generation mode</Label>
      <Select id="sel-mode" defaultValue="couple">
        <option value="text">Text</option>
        <option value="couple-text">Couple text</option>
        <option value="single">Single</option>
        <option value="couple">Couple</option>
        <option value="themed">Themed</option>
      </Select>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "grid", gap: 12, padding: 24, maxWidth: 340 }}>
      <Select defaultValue="en">
        <option value="en">English</option>
        <option value="zh-CN">简体中文</option>
      </Select>
      <Select defaultValue="openai" disabled>
        <option value="openai">OpenAI (locked)</option>
      </Select>
    </div>
  );
}
