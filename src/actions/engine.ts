import { ActionContext, ActionPayload, ActionResult } from "./types";
import { actionHandlers } from "./handlers";
import { logEvent } from "../services/logService";

/**
 * Exécute une action de façon centralisée.
 *
 * C'est le point de passage obligé pour toute action du bot, qu'elle soit
 * déclenchée par un clic de bouton aujourd'hui, ou par une commande slash /
 * un message programmé / une requête du panel web plus tard. Toute la
 * logique de vérification de permissions vit dans les handlers eux-mêmes ;
 * ce moteur se contente de router, journaliser et gérer la réponse à
 * l'utilisateur si une interaction est présente.
 */
export async function executeAction(
  payload: ActionPayload,
  ctx: ActionContext
): Promise<ActionResult> {
  const handler = actionHandlers[payload.type];

  if (!handler) {
    const logMessage = `Type d'action inconnu : "${payload.type}".`;
    console.error(`[actions] ${logMessage}`);
    return { success: false, userMessage: "Cette action n'est pas configurée correctement.", logMessage };
  }

  let result: ActionResult;
  try {
    result = await handler(payload, ctx);
  } catch (err) {
    const logMessage = `Erreur inattendue lors de l'exécution de "${payload.type}" : ${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error(`[actions] ${logMessage}`);
    result = {
      success: false,
      userMessage: "Une erreur inattendue est survenue. Réessaie plus tard.",
      logMessage,
    };
  }

  // Répond à l'utilisateur en éphémère si l'action a été déclenchée par un bouton.
  if (ctx.interaction && result.userMessage) {
    const replyPayload = { content: result.userMessage, ephemeral: true } as const;
    if (ctx.interaction.deferred || ctx.interaction.replied) {
      await ctx.interaction.editReply(result.userMessage).catch(() => undefined);
    } else {
      await ctx.interaction.reply(replyPayload).catch(() => undefined);
    }
  }

  await logEvent(ctx.member.client, {
    guildId: ctx.guildId,
    event: result.success ? "BUTTON_INTERACTION" : "BOT_ERROR",
    title: result.success ? "Action exécutée" : "Échec d'action",
    description: result.logMessage,
    isError: !result.success,
  });

  return result;
}
