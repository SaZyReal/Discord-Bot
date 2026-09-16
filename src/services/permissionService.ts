import {
  ChannelType,
  Guild,
  GuildTextBasedChannel,
  PermissionsBitField,
  Role,
} from "discord.js";

export class PermissionError extends Error {}

/**
 * Vérifie que le bot peut réellement envoyer un message dans le salon demandé.
 * Lève une PermissionError avec un message clair si ce n'est pas le cas,
 * plutôt que de laisser l'appel Discord échouer avec une erreur brute.
 */
export async function assertCanSendInChannel(
  guild: Guild,
  channelId: string
): Promise<GuildTextBasedChannel> {
  const channel = await guild.channels.fetch(channelId).catch(() => null);

  if (!channel) {
    throw new PermissionError("Salon introuvable. Vérifie l'identifiant du salon.");
  }

  if (
    channel.type !== ChannelType.GuildText &&
    channel.type !== ChannelType.GuildAnnouncement
  ) {
    throw new PermissionError("Ce salon ne permet pas l'envoi de messages texte.");
  }

  const me = await guild.members.fetchMe();
  const perms = channel.permissionsFor(me);

  if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) {
    throw new PermissionError("Le bot ne peut pas voir ce salon.");
  }
  if (!perms?.has(PermissionsBitField.Flags.SendMessages)) {
    throw new PermissionError("Le bot n'a pas la permission d'envoyer des messages dans ce salon.");
  }

  return channel as GuildTextBasedChannel;
}

/**
 * Vérifie que le bot peut attribuer/retirer le rôle demandé : le rôle du bot
 * doit être strictement au-dessus du rôle ciblé dans la hiérarchie du serveur.
 * C'est une règle imposée par l'API Discord, pas une préférence : impossible
 * de la contourner autrement qu'en réorganisant les rôles sur le serveur.
 */
export async function assertCanManageRole(guild: Guild, roleId: string): Promise<Role> {
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    throw new PermissionError("Rôle introuvable. Vérifie l'identifiant du rôle.");
  }

  const me = await guild.members.fetchMe();

  if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    throw new PermissionError("Le bot n'a pas la permission « Gérer les rôles » sur ce serveur.");
  }

  if (role.managed) {
    throw new PermissionError(
      "Ce rôle est géré automatiquement par une intégration et ne peut pas être attribué manuellement."
    );
  }

  if (role.position >= me.roles.highest.position) {
    throw new PermissionError(
      `Le bot ne peut pas attribuer le rôle « ${role.name} » : il est placé au-dessus (ou au même niveau) du rôle le plus haut du bot dans la hiérarchie du serveur. Déplace le rôle du bot au-dessus dans les paramètres du serveur.`
    );
  }

  return role;
}
