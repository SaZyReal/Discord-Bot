import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "./types";
import { COLORS } from "../../config/constants";

export const help: SlashCommand = {
  data: new SlashCommandBuilder().setName("help").setDescription("Affiche l'aide du bot."),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("Studio Bot — Aide")
      .setColor(COLORS.accent)
      .setDescription(
        "Voici les commandes disponibles. La configuration (messages, boutons, bienvenue, logs) se fait depuis le panel web."
      )
      .addFields(
        { name: "/ping", value: "Vérifie que le bot répond." },
        { name: "/help", value: "Affiche ce message." },
        {
          name: "/setup",
          value: "Affiche le lien vers le panel web de configuration (réservé aux administrateurs).",
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
