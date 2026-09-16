import { ActionContext, ActionResult, AddRolePayload } from "../types";
import { assertCanManageRole, PermissionError } from "../../services/permissionService";

export async function handleAddRole(
  payload: AddRolePayload,
  ctx: ActionContext
): Promise<ActionResult> {
  try {
    const role = await assertCanManageRole(ctx.member.guild, payload.roleId);

    if (ctx.member.roles.cache.has(role.id)) {
      return {
        success: true,
        userMessage: `Tu as déjà le rôle **${role.name}**.`,
        logMessage: `${ctx.member.user.tag} a tenté d'obtenir le rôle "${role.name}" (déjà présent).`,
      };
    }

    await ctx.member.roles.add(role, "Action configurée via le panel");

    return {
      success: true,
      userMessage: payload.successMessage ?? `Tu as reçu le rôle **${role.name}** !`,
      logMessage: `${ctx.member.user.tag} a reçu le rôle "${role.name}".`,
    };
  } catch (err) {
    if (err instanceof PermissionError) {
      return { success: false, userMessage: err.message, logMessage: err.message };
    }
    throw err;
  }
}
