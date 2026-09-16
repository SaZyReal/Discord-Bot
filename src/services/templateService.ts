import { GuildMember } from "discord.js";

/**
 * Remplace les variables {user} {username} {server} {memberCount} dans un
 * gabarit de message. Prévu pour être réutilisé par d'autres messages
 * automatiques (départ, boost...) ajoutés plus tard.
 */
export function renderTemplate(template: string, member: GuildMember): string {
  return template
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{memberCount}", String(member.guild.memberCount));
}
