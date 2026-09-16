import { Client, EmbedBuilder } from "discord.js";
import { prisma } from "../database/client";
import { COLORS, LogEventType } from "../config/constants";

interface LogFieldsInput {
  guildId: string;
  event: LogEventType;
  title: string;
  description: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  isError?: boolean;
}

/**
 * Envoie un log dans le salon configuré pour ce serveur, uniquement si :
 *  - un LogConfig existe pour ce guild,
 *  - le type d'événement fait partie de la liste des événements activés.
 * Échoue silencieusement (avec un simple console.error) si le salon n'est
 * plus accessible : un problème de logs ne doit jamais faire planter une
 * action métier.
 */
export async function logEvent(client: Client, input: LogFieldsInput): Promise<void> {
  try {
    const config = await prisma.logConfig.findUnique({ where: { guildId: input.guildId } });
    if (!config) return;

    const enabledEvents: string[] = JSON.parse(config.events);
    if (!enabledEvents.includes(input.event)) return;

    const guild = await client.guilds.fetch(input.guildId).catch(() => null);
    if (!guild) return;

    const channel = await guild.channels.fetch(config.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(input.title)
      .setDescription(input.description)
      .setColor(input.isError ? COLORS.error : COLORS.accent)
      .setTimestamp();

    if (input.fields?.length) {
      embed.addFields(input.fields);
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("[logService] échec de l'envoi d'un log :", err);
  }
}
