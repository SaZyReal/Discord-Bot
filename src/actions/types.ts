import { ButtonInteraction, GuildMember } from "discord.js";

/**
 * Liste des types d'actions disponibles. Pour ajouter une nouvelle action :
 *   1. Ajouter sa valeur ici et son type de payload ci-dessous.
 *   2. Créer un fichier dans src/actions/handlers/.
 *   3. L'enregistrer dans src/actions/handlers/index.ts.
 * Rien d'autre à modifier : ni le panel web, ni le routeur d'interactions
 * n'ont besoin de connaître les détails de la nouvelle action.
 */
export type ActionType =
  | "ADD_ROLE"
  | "REMOVE_ROLE"
  | "TOGGLE_ROLE"
  | "SEND_DM"
  | "EPHEMERAL_MESSAGE";

export interface AddRolePayload {
  type: "ADD_ROLE";
  roleId: string;
  /** Message affiché en éphémère à l'utilisateur après succès (optionnel). */
  successMessage?: string;
}

export interface RemoveRolePayload {
  type: "REMOVE_ROLE";
  roleId: string;
  successMessage?: string;
}

export interface ToggleRolePayload {
  type: "TOGGLE_ROLE";
  roleId: string;
  /** Message si le rôle vient d'être ajouté. */
  addedMessage?: string;
  /** Message si le rôle vient d'être retiré. */
  removedMessage?: string;
}

export interface SendDmPayload {
  type: "SEND_DM";
  message: string;
}

export interface EphemeralMessagePayload {
  type: "EPHEMERAL_MESSAGE";
  message: string;
}

export type ActionPayload =
  | AddRolePayload
  | RemoveRolePayload
  | ToggleRolePayload
  | SendDmPayload
  | EphemeralMessagePayload;

/**
 * Contexte d'exécution transmis à chaque handler. `interaction` n'est présent
 * que si l'action est déclenchée par un clic de bouton (permet de répondre
 * en éphémère) ; une action pourra plus tard être déclenchée sans interaction
 * (ex: programmée), d'où le fait que ce champ soit optionnel.
 */
export interface ActionContext {
  guildId: string;
  member: GuildMember;
  interaction?: ButtonInteraction;
}

export interface ActionResult {
  success: boolean;
  /** Message destiné à l'utilisateur (affiché en éphémère si une interaction est présente). */
  userMessage?: string;
  /** Message destiné aux logs internes, plus détaillé qu'un message utilisateur. */
  logMessage: string;
}

export type ActionHandler = (
  payload: ActionPayload,
  ctx: ActionContext
) => Promise<ActionResult>;
