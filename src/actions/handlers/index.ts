import { ActionHandler, ActionType } from "../types";
import { handleAddRole } from "./addRole";
import { handleRemoveRole } from "./removeRole";
import { handleToggleRole } from "./toggleRole";
import { handleSendDm } from "./sendDm";
import { handleEphemeralMessage } from "./ephemeralMessage";

/**
 * Pour ajouter une nouvelle action au système :
 *   1. Ajouter son type dans src/actions/types.ts (ActionType + Payload).
 *   2. Créer le fichier handler dans ce dossier (même forme que les autres).
 *   3. L'ajouter ci-dessous.
 * Aucune autre partie du code n'a besoin d'être modifiée.
 */
export const actionHandlers: Record<ActionType, ActionHandler> = {
  ADD_ROLE: handleAddRole as ActionHandler,
  REMOVE_ROLE: handleRemoveRole as ActionHandler,
  TOGGLE_ROLE: handleToggleRole as ActionHandler,
  SEND_DM: handleSendDm as ActionHandler,
  EPHEMERAL_MESSAGE: handleEphemeralMessage as ActionHandler,
};
