import { GuildMember, PartialGuildMember } from "discord.js";
import { logEvent } from "../../services/logService";

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  await logEvent(member.client, {
    guildId: member.guild.id,
    event: "MEMBER_LEAVE",
    title: "Membre parti",
    description: `${member.user.tag} a quitté le serveur.`,
  });
}
