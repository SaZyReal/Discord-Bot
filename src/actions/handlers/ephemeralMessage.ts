import { ActionContext, ActionResult, EphemeralMessagePayload } from "../types";
import { renderTemplate } from "../../services/templateService";

export async function handleEphemeralMessage(
  payload: EphemeralMessagePayload,
  ctx: ActionContext
): Promise<ActionResult> {
  const content = renderTemplate(payload.message, ctx.member);
  return {
    success: true,
    userMessage: content,
    logMessage: `Message éphémère affiché à ${ctx.member.user.tag}.`,
  };
}
