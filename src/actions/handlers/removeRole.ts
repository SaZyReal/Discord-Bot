import { ActionContext, ActionResult, RemoveRolePayload } from "../types";
import { assertCanManageRole, PermissionError } from "../../services/permissionService";

export async function handleRemoveRole(
  payload: RemoveRolePayload,
  ctx: ActionContext
): Promise<ActionResult> {
  try {
    const role = await assertCanManageRole(ctx.member.guild, payload.roleId);

    if (!ctx.member.roles.cache.has(role.id)) {
      return {
        success: true,
        userMessage: `Tu n'as pas le rôle **${role.name}**.`,
        logMessage: `${ctx.member.user.tag} a tenté de retirer le rôle "${role.name}" (absent).`,
      };
    }

    await ctx.member.roles.remove(role, "Action configurée via le panel");

    return {
      success: true,
      userMessage: payload.successMessage ?? `Le rôle **${role.name}** t'a été retiré.`,
      logMessage: `${ctx.member.user.tag} a perdu le rôle "${role.name}".`,
    };
  } catch (err) {
    if (err instanceof PermissionError) {
      return { success: false, userMessage: err.message, logMessage: err.message };
    }
    throw err;
  }
}
