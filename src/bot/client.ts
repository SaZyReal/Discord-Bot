import { Client, Collection } from "discord.js";
import { BOT_INTENTS, BOT_PARTIALS } from "../config/intents";
import { loadCommands, SlashCommand } from "./commands";
import { registerEvents } from "./events";

// Étend le type Client pour y stocker la collection de commandes chargées.
declare module "discord.js" {
  interface Client {
    commands: Collection<string, SlashCommand>;
  }
}

export function createBotClient(): Client {
  const client = new Client({
    intents: BOT_INTENTS,
    partials: BOT_PARTIALS,
  });

  client.commands = loadCommands();
  registerEvents(client);

  return client;
}
