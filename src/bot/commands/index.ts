import { Collection } from "discord.js";
import { SlashCommand } from "./types";
import { ping } from "./ping";
import { help } from "./help";
import { setup } from "./setup";

export type { SlashCommand } from "./types";

/**
 * Liste centrale des commandes. Pour en ajouter une : créer le fichier dans
 * ce dossier (même forme que ping.ts) puis l'ajouter ici.
 */
const allCommands: SlashCommand[] = [ping, help, setup];

export function loadCommands(): Collection<string, SlashCommand> {
  const collection = new Collection<string, SlashCommand>();
  for (const command of allCommands) {
    collection.set(command.data.name, command);
  }
  return collection;
}

/** Utilisé par le script de déploiement des commandes (scripts/deploy-commands.ts). */
export function getCommandsJSON() {
  return allCommands.map((c) => c.data.toJSON());
}
