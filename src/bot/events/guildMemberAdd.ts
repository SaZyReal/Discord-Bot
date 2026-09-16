import { EmbedBuilder, GuildMember } from "discord.js";
import { prisma } from "../../database/client";
import { renderTemplate } from "../../services/templateService";
import { assertCanSendInChannel, PermissionError } from "../../services/permissionService";
import { logEvent } from "../../services/logService";
import { COLORS } from "../../config/constants";

export async function onGuildMemberAdd(member: GuildMember) {
  await logEvent(member.client, {
    guildId: member.guild.id,
    event: "MEMBER_JOIN",
    title: "Membre arrivé",
    description: `${member.user.tag} a rejoint le serveur.`,
  });

  const config = await prisma.welcomeConfig.findUnique({ where: { guildId: member.guild.id } });
  if (!config || !config.enabled) return;

  try {
    const channel = await assertCanSendInChannel(member.guild, config.channelId);
    const content = renderTemplate(config.message, member);

    if (config.isEmbed) {
      const embed = new EmbedBuilder()
        .setDescription(content)
        .setColor(parseColor(config.embedColor) ?? COLORS.accent)
        .setThumbnail(member.user.displayAvatarURL());
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send({ content });
    }
  } catch (err) {
    const message = err instanceof PermissionError ? err.message : String(err);
    console.error(`[welcome] échec d'envoi sur le serveur ${member.guild.id} :`, message);
    await logEvent(member.client, {
      guildId: member.guild.id,
      event: "BOT_ERROR",
      title: "Échec du message de bienvenue",
      description: message,
      isError: true,
    });
  }
}

function parseColor(hex: string | null): number | undefined {
  if (!hex) return undefined;
  const parsed = parseInt(hex.replace("#", ""), 16);
  return Number.isNaN(parsed) ? undefined : parsed;
}
