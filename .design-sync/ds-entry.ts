// design-sync bundle entry: re-exports the Simi Avatar UI primitives so the
// converter can build window.SimiAvatar from the repo's own component sources.
// The repo is a Next.js app (no published dist/), so this stands in for a
// library entry point. Component-internal "@/lib/utils" imports resolve via
// cfg.tsconfig's path aliases.
export { Button, buttonVariants } from "../components/ui/button";
export { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
export { Input } from "../components/ui/input";
export { Label } from "../components/ui/label";
export { Select } from "../components/ui/select";
export { Textarea } from "../components/ui/textarea";
