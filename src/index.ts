import fs from "node:fs";
import path from "node:path";

// S'assure que le dossier de la base SQLite existe avant que Prisma n'essaie
// d'y créer le fichier (utile seulement avec l'URL par défaut file:./data/...).
fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });

import { env } from "./config/env";
import { createBotClient } from "./bot/client";
import { createWebApp } from "./web/app";
import { prisma } from "./database/client";

async function main() {
  const client = createBotClient();

  await client.login(env.discordToken);

  const app = createWebApp(client);
  app.listen(env.port, () => {
    console.log(`[web] Panel disponible sur http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[app] Signal ${signal} reçu, arrêt en cours...`);
    client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Échec du démarrage de l'application :", err);
  process.exit(1);
});
