import { Client } from "discord.js";
import { ensureGuildExists } from "../../database/client";

export async function onReady(client: Client<true>) {
  console.log(`[bot] Connecté en tant que ${client.user.tag} (${client.guilds.cache.size} serveur(s))`);

  // S'assure que chaque serveur sur lequel le bot est déjà présent existe en base.
  for (const guild of client.guilds.cache.values()) {
    await ensureGuildExists(guild.id, guild.name).catch((err) =>
      console.error(`[bot] échec de synchronisation du serveur ${guild.id} :`, err)
    );
  }
}
