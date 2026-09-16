import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "./types";

export const ping: SlashCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Vérifie que le bot répond."),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ content: "Ping...", fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `🏓 Pong ! Latence : ${latency}ms — API Discord : ${Math.round(interaction.client.ws.ping)}ms`
    );
  },
};
