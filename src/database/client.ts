import { PrismaClient } from "@prisma/client";

// Singleton : un seul PrismaClient pour toute l'application (bot + web),
// pour éviter d'épuiser les connexions à la base au fil des rechargements.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

/**
 * Garantit qu'un Guild existe en base avant d'y rattacher de la config.
 * Appelé à chaque fois qu'on touche à la config d'un serveur.
 */
export async function ensureGuildExists(guildId: string, name?: string) {
  return prisma.guild.upsert({
    where: { id: guildId },
    update: name ? { name } : {},
    create: { id: guildId, name },
  });
}
