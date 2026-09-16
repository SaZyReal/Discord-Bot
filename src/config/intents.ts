import { GatewayIntentBits, Partials } from "discord.js";

/**
 * Intents demandés, avec la justification de chacun. Ne rien ajouter ici
 * sans une fonctionnalité concrète qui en a besoin : chaque intent
 * supplémentaire est une surface d'attaque et, pour les intents
 * privilégiés, une contrainte de vérification si le bot grossit un jour.
 *
 * - Guilds              : indispensable, de base, pour connaître les serveurs/salons/rôles.
 * - GuildMembers (PRIVILÉGIÉ) : nécessaire pour détecter l'arrivée d'un membre
 *   (message de bienvenue) et pour résoudre les membres de façon fiable.
 *   → à activer dans le portail développeur (onglet "Bot" > "Privileged Gateway Intents").
 * - GuildModeration     : nécessaire pour logger/écouter les bans (utile aux logs).
 *
 * Volontairement absents :
 * - MessageContent (privilégié) : pas besoin de lire le texte des messages,
 *   tout passe par des slash commands et des boutons.
 * - GuildMessageReactions : pas de fonctionnalité basée sur les réactions dans le MVP.
 */
export const BOT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration,
];

/**
 * Partials nécessaires pour que discord.js puisse traiter des objets
 * (membres, utilisateurs) même quand ils ne sont pas déjà en cache.
 */
export const BOT_PARTIALS = [Partials.GuildMember, Partials.User];
