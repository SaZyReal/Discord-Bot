import { ButtonInteraction, ChatInputCommandInteraction, Interaction } from "discord.js";
import { prisma } from "../../database/client";
import { executeAction } from "../../actions/engine";
import { ActionPayload } from "../../actions/types";
import { isBotAdmin } from "../../services/adminService";
import { logEvent } from "../../services/logService";

export async function onInteractionCreate(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
    return;
  }

  if (interaction.isButton()) {
    await handleButtonClick(interaction);
    return;
  }
}

async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (command.adminOnly && interaction.inGuild()) {
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const allowed = await isBotAdmin(member);
      if (!allowed) {
        await interaction.reply({
          content: "Tu n'as pas la permission d'utiliser cette commande.",
          ephemeral: true,
        });
        return;
      }
    }

    await command.execute(interaction);

    if (interaction.guildId) {
      await logEvent(interaction.client, {
        guildId: interaction.guildId,
        event: "COMMAND_USED",
        title: "Commande utilisée",
        description: `${interaction.user.tag} a utilisé /${interaction.commandName}.`,
      });
    }
  } catch (err) {
    console.error(`[commands] erreur dans /${interaction.commandName} :`, err);
    const replyPayload = { content: "Une erreur est survenue lors de l'exécution de cette commande.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyPayload).catch(() => undefined);
    } else {
      await interaction.reply(replyPayload).catch(() => undefined);
    }
    if (interaction.guildId) {
      await logEvent(interaction.client, {
        guildId: interaction.guildId,
        event: "BOT_ERROR",
        title: "Erreur de commande",
        description: `/${interaction.commandName} : ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      });
    }
  }
}

async function handleButtonClick(interaction: ButtonInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: "Ce bouton ne fonctionne que sur un serveur.", ephemeral: true });
    return;
  }

  const config = await prisma.buttonConfig.findUnique({ where: { customId: interaction.customId } });
  if (!config) {
    // Bouton orphelin (config supprimée depuis le panel) : on le signale proprement.
    await interaction.reply({
      content: "Ce bouton n'est plus configuré. Contacte un administrateur.",
      ephemeral: true,
    });
    return;
  }

  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const payload = JSON.parse(config.actionPayload) as ActionPayload;

    await executeAction(payload, {
      guildId: interaction.guild.id,
      member,
      interaction,
    });
  } catch (err) {
    console.error(`[buttons] erreur sur le bouton "${interaction.customId}" :`, err);
    const replyPayload = { content: "Une erreur est survenue. Réessaie plus tard.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyPayload).catch(() => undefined);
    } else {
      await interaction.reply(replyPayload).catch(() => undefined);
    }
  }
}
