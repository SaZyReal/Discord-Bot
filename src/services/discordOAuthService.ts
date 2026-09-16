import { env } from "../config/env";

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

/**
 * Construit l'URL d'autorisation Discord. Scope volontairement limité à
 * "identify" : on a seulement besoin de savoir QUI se connecte. On ne
 * demande jamais le scope "guilds", car on ne veut pas être tenté de faire
 * confiance à la liste de serveurs/permissions renvoyée par Discord au nom
 * du navigateur — les droits d'admin sont toujours revérifiés par le bot
 * lui-même (voir adminService.isBotAdmin), à partir de ses propres données.
 */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.discordClientId,
    redirect_uri: env.discordRedirectUri,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: env.discordClientId,
    client_secret: env.discordClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.discordRedirectUri,
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Échange du code OAuth2 échoué (${response.status}).`);
  }

  const json = (await response.json()) as { access_token: string };
  return json.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Récupération du profil Discord échouée (${response.status}).`);
  }

  return (await response.json()) as DiscordUser;
}
