import { ActionContext, ActionResult, ToggleRolePayload } from "../types";
import { assertCanManageRole, PermissionError } from "../../services/permissionService";

export async function handleToggleRole(
  payload: ToggleRolePayload,
  ctx: ActionContext
): Promise<ActionResult> {
  try {
    const role = await assertCanManageRole(ctx.member.guild, payload.roleId);
    const hasRole = ctx.member.roles.cache.has(role.id);

    if (hasRole) {
      await ctx.member.roles.remove(role, "Action configurée via le panel (toggle)");
      return {
        success: true,
        userMessage: payload.removedMessage ?? `Le rôle **${role.name}** t'a été retiré.`,
        logMessage: `${ctx.member.user.tag} a perdu le rôle "${role.name}" (toggle).`,
      };
    }

    await ctx.member.roles.add(role, "Action configurée via le panel (toggle)");
    return {
      success: true,
      userMessage: payload.addedMessage ?? `Tu as reçu le rôle **${role.name}** !`,
      logMessage: `${ctx.member.user.tag} a reçu le rôle "${role.name}" (toggle).`,
    };
  } catch (err) {
    if (err instanceof PermissionError) {
      return { success: false, userMessage: err.message, logMessage: err.message };
    }
    throw err;
  }
}
