import { Guild } from "discord.js";
import { ensureGuildExists } from "../../database/client";

export async function onGuildCreate(guild: Guild) {
  await ensureGuildExists(guild.id, guild.name);
  console.log(`[bot] Ajouté au serveur "${guild.name}" (${guild.id})`);
}
