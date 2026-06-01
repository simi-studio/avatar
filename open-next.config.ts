import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext Cloudflare adapter config. The MVP needs no incremental cache,
 * queue, or tag store — Simi Avatar is stateless (BYOK, no DB/KV/R2/D1).
 */
export default defineCloudflareConfig();
