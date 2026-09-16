import { PermissionFlagsBits } from "discord.js";

/**
 * Permissions Discord nécessaires au bot pour le MVP. Documentées aussi
 * dans le README. On ne demande jamais "Administrateur" : uniquement les
 * permissions réellement utilisées par les fonctionnalités actives.
 */
export const REQUIRED_BOT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.ManageRoles,
];

/** Événements de logs configurables depuis le panel. */
export const LOG_EVENT_TYPES = {
  MEMBER_JOIN: "Membre a rejoint",
  MEMBER_LEAVE: "Membre a quitté",
  ROLE_GRANTED: "Rôle attribué",
  ROLE_REVOKED: "Rôle retiré",
  BUTTON_INTERACTION: "Interaction avec un bouton",
  COMMAND_USED: "Commande utilisée",
  BOT_ERROR: "Erreur du bot",
} as const;

export type LogEventType = keyof typeof LOG_EVENT_TYPES;

/** Styles de boutons proposés depuis le panel (sous-ensemble de ButtonStyle). */
export const BUTTON_STYLES = ["PRIMARY", "SECONDARY", "SUCCESS", "DANGER"] as const;
export type ButtonStyleName = (typeof BUTTON_STYLES)[number];

export const COLORS = {
  accent: 0x2f5d50,
  success: 0x2f6f4e,
  error: 0xb3261e,
};
