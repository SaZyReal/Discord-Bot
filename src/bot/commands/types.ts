import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface SlashCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  /** Si true, l'exécution est refusée si l'utilisateur n'est pas admin du bot sur ce serveur. */
  adminOnly?: boolean;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
