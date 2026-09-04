export interface Env {
  DISCORD_WEBHOOK_URL: string;
}

const ALLOWED_ORIGINS = new Set(["https://btmpierre.me"]);
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 3;
const requestLog = new Map<string, { count: number; resetAt: number }>();

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "null";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: Record<string, string>, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = requestLog.get(ip);
  if (!current || current.resetAt <= now) {
    requestLog.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS" && origin && ALLOWED_ORIGINS.has(origin)) {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST" || !origin || !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Requête non autorisée." }, 403, origin);
    }
    if (request.headers.get("Content-Type") !== "application/json") {
      return json({ error: "Type de contenu non autorisé." }, 415, origin);
    }
    const referer = request.headers.get("Referer");
    if (referer && !referer.startsWith(`${origin}/`)) {
      return json({ error: "Origine non autorisée." }, 403, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (isRateLimited(ip)) {
      return json({ error: "Trop de demandes. Réessayez dans une minute." }, 429, origin);
    }

    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (!Number.isFinite(contentLength) || contentLength > 10_000) {
      return json({ error: "Message trop volumineux." }, 413, origin);
    }

    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "Requête invalide." }, 400, origin);
    }

    if (payload.honeypot) {
      return json({ success: "true" }, 200, origin);
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (name.length < 2 || name.length > 100 || !isValidEmail(email) || message.length < 3 || message.length > 4_000) {
      return json({ error: "Veuillez vérifier les champs du formulaire." }, 400, origin);
    }
    if (!env.DISCORD_WEBHOOK_URL || !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(env.DISCORD_WEBHOOK_URL)) {
      return json({ error: "Le service de contact est momentanément indisponible." }, 503, origin);
    }

    const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Portfolio contact",
        allowed_mentions: { parse: [] },
        embeds: [{
          title: "Nouveau message depuis le portfolio",
          color: 0x8b5cf6,
          fields: [
            { name: "Nom", value: name, inline: true },
            { name: "Email", value: email, inline: true },
            { name: "Message", value: message },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!discordResponse.ok) {
      return json({ error: "Le message n'a pas pu être envoyé." }, 502, origin);
    }
    return json({ success: "true" }, 200, origin);
  },
};