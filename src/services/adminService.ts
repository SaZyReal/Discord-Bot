import { Client, GuildMember, PermissionsBitField } from "discord.js";
import { prisma } from "../database/client";

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
}

/**
 * Un membre est considéré "administrateur du bot" sur un serveur si :
 *  - il a la permission Discord native "Administrateur", OU
 *  - il possède un des rôles listés dans AdminRole pour ce serveur.
 *
 * Cette vérification se fait toujours via un objet GuildMember obtenu par
 * un `fetch` du bot lui-même (jamais à partir de données envoyées par le
 * navigateur) : c'est la garantie que la vérification est fiable.
 */
export async function isBotAdmin(member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return true;
  }

  const adminRoles = await prisma.adminRole.findMany({ where: { guildId: member.guild.id } });
  if (adminRoles.length === 0) return false;

  return adminRoles.some((ar: { roleId: string }) => member.roles.cache.has(ar.roleId));
}

/**
 * Liste les serveurs (parmi ceux où le bot est présent) qu'un utilisateur
 * Discord donné peut administrer. Utilisée juste après la connexion OAuth2 :
 * on ne se base que sur les données du bot (fetch du membre), jamais sur ce
 * que le navigateur prétend.
 */
export async function listManageableGuilds(client: Client, userId: string): Promise<ManageableGuild[]> {
  const results: ManageableGuild[] = [];

  for (const guild of client.guilds.cache.values()) {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) continue;

    if (await isBotAdmin(member)) {
      results.push({ id: guild.id, name: guild.name, icon: guild.iconURL() });
    }
  }

  return results;
}
