"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

import type { CompiledProviderRequest } from "@/lib/prompt-compiler";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/**
 * Read-only view of the exact prompt the app compiles for the selected provider.
 * The compiled request is derived purely from the avatar intent, style, and
 * theme — it can never contain the API key — so surfacing it is safe and helps
 * developers understand and tune what is actually sent upstream.
 */
export function CompiledPromptPanel({
  request,
}: {
  request: CompiledProviderRequest;
}) {
  const tf = useTranslations("Form");
  const tp = useTranslations("Provider");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(request.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const providerLabel = tp(request.provider);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="compiled-prompt">{tf("compiledPromptLabel")}</Label>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? tf("copied") : tf("copyPrompt")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {tf("compiledPromptHint", { provider: providerLabel })}
      </p>
      <pre
        id="compiled-prompt"
        className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-foreground"
      >
        {request.prompt}
      </pre>
      {request.negativePrompt && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            {tf("negativePromptLabel")}
          </span>
          <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
            {request.negativePrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
