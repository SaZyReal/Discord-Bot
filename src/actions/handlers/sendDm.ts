import { ActionContext, ActionResult, SendDmPayload } from "../types";
import { renderTemplate } from "../../services/templateService";

export async function handleSendDm(
  payload: SendDmPayload,
  ctx: ActionContext
): Promise<ActionResult> {
  const content = renderTemplate(payload.message, ctx.member);

  try {
    await ctx.member.send(content);
    return {
      success: true,
      userMessage: "Je t'ai envoyé un message privé !",
      logMessage: `Message privé envoyé à ${ctx.member.user.tag}.`,
    };
  } catch {
    // Cas fréquent : l'utilisateur a désactivé les messages privés des
    // membres du serveur. Ce n'est pas une erreur du bot, on le précise.
    return {
      success: false,
      userMessage:
        "Je n'ai pas pu t'envoyer de message privé — vérifie que tu acceptes les messages privés des membres de ce serveur.",
      logMessage: `Échec d'envoi de MP à ${ctx.member.user.tag} (MPs probablement fermés).`,
    };
  }
}
