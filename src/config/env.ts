import "dotenv/config";

/**
 * Toutes les variables d'environnement nécessaires sont validées ici, une
 * seule fois, au démarrage. Si une variable obligatoire manque, le process
 * s'arrête immédiatement avec un message clair plutôt que de planter plus
 * tard avec une erreur cryptique.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Vérifie ton fichier .env (voir .env.example).`
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const env = {
  discordToken: required("DISCORD_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordClientSecret: required("DISCORD_CLIENT_SECRET"),
  discordRedirectUri: required("DISCORD_REDIRECT_URI"),

  port: parseInt(optional("PORT", "3000"), 10),
  sessionSecret: required("SESSION_SECRET"),
  publicBaseUrl: optional("PUBLIC_BASE_URL", "http://localhost:3000"),

  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: optional("NODE_ENV", "development") === "production",

  devGuildId: process.env.DEV_GUILD_ID?.trim() || undefined,
} as const;
