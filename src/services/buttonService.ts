import crypto from "node:crypto";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
} from "discord.js";
import { ButtonConfig } from "@prisma/client";
import { prisma } from "../database/client";
import { assertCanSendInChannel } from "./permissionService";
import { ButtonStyleName } from "../config/constants";

const STYLE_MAP: Record<ButtonStyleName, ButtonStyle> = {
  PRIMARY: ButtonStyle.Primary,
  SECONDARY: ButtonStyle.Secondary,
  SUCCESS: ButtonStyle.Success,
  DANGER: ButtonStyle.Danger,
};

const MAX_BUTTONS_PER_MESSAGE = 25; // limite Discord : 5 lignes x 5 boutons

export function generateCustomId(): string {
  return `btn_${crypto.randomBytes(8).toString("hex")}`;
}

function toButtonBuilder(config: ButtonConfig): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(config.customId)
    .setLabel(config.label)
    .setStyle(STYLE_MAP[config.style as ButtonStyleName] ?? ButtonStyle.Primary);

  if (config.emoji) button.setEmoji(config.emoji);
  return button;
}

/** Regroupe une liste de boutons en lignes de 5 maximum (limite Discord). */
export function buildActionRows(configs: ButtonConfig[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < configs.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      configs.slice(i, i + 5).map(toButtonBuilder)
    );
    rows.push(row);
  }
  return rows;
}

export interface NewButtonInput {
  label: string;
  emoji?: string;
  style: ButtonStyleName;
  actionType: string;
  actionPayload: string; // JSON déjà sérialisé
}

/**
 * Publie un nouveau message contenant un unique bouton dans le salon indiqué.
 * Utilisé quand l'admin choisit "créer un nouveau message" depuis le panel.
 */
export async function postNewButtonMessage(
  guild: Guild,
  channelId: string,
  content: string,
  input: NewButtonInput
) {
  const channel = await assertCanSendInChannel(guild, channelId);
  const customId = generateCustomId();

  const button = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(input.label)
    .setStyle(STYLE_MAP[input.style] ?? ButtonStyle.Primary);
  if (input.emoji) button.setEmoji(input.emoji);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
  const message = await channel.send({ content, components: [row] });

  await prisma.buttonConfig.create({
    data: {
      guildId: guild.id,
      channelId,
      messageId: message.id,
      customId,
      label: input.label,
      emoji: input.emoji ?? null,
      style: input.style,
      actionType: input.actionType,
      actionPayload: input.actionPayload,
    },
  });

  return message;
}

/**
 * Ajoute un bouton supplémentaire à un message déjà posté par le bot depuis
 * le panel (identifié par son messageId). Reconstruit l'intégralité des
 * lignes de boutons à partir de la base, puis édite le message.
 *
 * Limitation Discord : impossible d'ajouter un composant à un message qui
 * n'a pas été envoyé par le bot lui-même (l'API ne permet d'éditer que ses
 * propres messages) — d'où l'obligation de passer par des messages créés
 * depuis ce panel plutôt que par un "Message ID" arbitraire.
 */
export async function addButtonToMessage(
  guild: Guild,
  channelId: string,
  messageId: string,
  input: NewButtonInput
) {
  const existing = await prisma.buttonConfig.findMany({
    where: { guildId: guild.id, channelId, messageId },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length >= MAX_BUTTONS_PER_MESSAGE) {
    throw new Error(`Ce message a déjà atteint la limite de ${MAX_BUTTONS_PER_MESSAGE} boutons.`);
  }

  const channel = await assertCanSendInChannel(guild, channelId);
  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message || !message.author.bot) {
    throw new Error("Ce message n'existe pas ou n'a pas été envoyé par le bot — impossible d'y ajouter un bouton.");
  }

  const customId = generateCustomId();
  const created = await prisma.buttonConfig.create({
    data: {
      guildId: guild.id,
      channelId,
      messageId,
      customId,
      label: input.label,
      emoji: input.emoji ?? null,
      style: input.style,
      actionType: input.actionType,
      actionPayload: input.actionPayload,
    },
  });

  const allConfigs = [...existing, created];
  await message.edit({ components: buildActionRows(allConfigs) });

  return message;
}

export async function deleteButton(guildId: string, buttonId: string, guild: Guild) {
  const config = await prisma.buttonConfig.findFirst({ where: { id: buttonId, guildId } });
  if (!config) return;

  await prisma.buttonConfig.delete({ where: { id: buttonId } });

  // Retire le bouton du message Discord en reconstruisant les lignes restantes.
  const remaining = await prisma.buttonConfig.findMany({
    where: { guildId, channelId: config.channelId, messageId: config.messageId },
    orderBy: { createdAt: "asc" },
  });

  const channel = await guild.channels.fetch(config.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const message = await channel.messages.fetch(config.messageId).catch(() => null);
  if (!message) return;

  await message
    .edit({ components: remaining.length ? buildActionRows(remaining) : [] })
    .catch(() => undefined);
}
