import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "./types";
import { env } from "../../config/env";
import { ensureGuildExists } from "../../database/client";

// Note : la vérification "est-ce un admin du bot" est déjà faite en amont,
// dans interactionCreate.ts, grâce au flag `adminOnly` ci-dessous — inutile
// de la dupliquer ici.
export const setup: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Affiche le lien du panel de configuration du bot."),
  adminOnly: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({ content: "Cette commande doit être utilisée sur un serveur.", ephemeral: true });
      return;
    }

    await ensureGuildExists(interaction.guild.id, interaction.guild.name);

    await interaction.reply({
      content: `Panel de configuration : ${env.publicBaseUrl}/dashboard/${interaction.guild.id}\n\nConnecte-toi avec ton compte Discord.`,
      ephemeral: true,
    });
  },
};
