import { REST, Routes } from "discord.js";
import { env } from "../src/config/env";
import { getCommandsJSON } from "../src/bot/commands";

async function main() {
  const rest = new REST({ version: "10" }).setToken(env.discordToken);
  const commands = getCommandsJSON();

  if (env.devGuildId) {
    console.log(`Enregistrement de ${commands.length} commande(s) sur le serveur de dev (${env.devGuildId})...`);
    await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.devGuildId), { body: commands });
    console.log("Commandes enregistrées sur le serveur de dev (disponibles immédiatement).");
  } else {
    console.log(`Enregistrement de ${commands.length} commande(s) globalement...`);
    await rest.put(Routes.applicationCommands(env.discordClientId), { body: commands });
    console.log("Commandes enregistrées globalement (la propagation peut prendre jusqu'à 1h).");
  }
}

main().catch((err) => {
  console.error("Échec de l'enregistrement des commandes :", err);
  process.exit(1);
});
