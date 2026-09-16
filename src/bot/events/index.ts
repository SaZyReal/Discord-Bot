import { Client, Events } from "discord.js";
import { onReady } from "./ready";
import { onGuildCreate } from "./guildCreate";
import { onGuildMemberAdd } from "./guildMemberAdd";
import { onGuildMemberRemove } from "./guildMemberRemove";
import { onInteractionCreate } from "./interactionCreate";

export function registerEvents(client: Client) {
  client.once(Events.ClientReady, onReady);
  client.on(Events.GuildCreate, onGuildCreate);
  client.on(Events.GuildMemberAdd, onGuildMemberAdd);
  client.on(Events.GuildMemberRemove, onGuildMemberRemove);
  client.on(Events.InteractionCreate, onInteractionCreate);

  client.on(Events.Error, (err) => console.error("[bot] erreur du client Discord :", err));
  client.on(Events.ShardError, (err) => console.error("[bot] erreur de shard :", err));
}
