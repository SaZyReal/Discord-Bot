import { Store, SessionData } from "express-session";
import { prisma } from "./client";

/**
 * Store de sessions maison, backé par la table Prisma `Session`.
 *
 * Pourquoi ne pas utiliser le store mémoire par défaut d'express-session ?
 * Parce qu'il vide toutes les sessions à chaque redémarrage du bot (déploiement,
 * crash, mise à jour) — chaque admin serait déconnecté à chaque redémarrage.
 * Un store persistant évite ça sans ajouter de dépendance externe : on
 * réutilise la même base SQLite que le reste du projet.
 */
export class PrismaSessionStore extends Store {
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    super();
    // Nettoyage périodique des sessions expirées (toutes les heures).
    this.cleanupInterval = setInterval(() => {
      prisma.session
        .deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch((err: unknown) => console.error("[session] échec du nettoyage :", err));
    }, 60 * 60 * 1000);
    this.cleanupInterval.unref();
  }

  async get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void
  ): Promise<void> {
    try {
      const record = await prisma.session.findUnique({ where: { id: sid } });
      if (!record || record.expiresAt < new Date()) {
        return callback(null, null);
      }
      callback(null, JSON.parse(record.data));
    } catch (err) {
      callback(err);
    }
  }

  async set(
    sid: string,
    session: SessionData,
    callback?: (err?: unknown) => void
  ): Promise<void> {
    try {
      const maxAgeMs = session.cookie?.maxAge ?? 1000 * 60 * 60 * 24; // 24h par défaut
      const expiresAt = new Date(Date.now() + maxAgeMs);
      const data = JSON.stringify(session);
      await prisma.session.upsert({
        where: { id: sid },
        update: { data, expiresAt },
        create: { id: sid, data, expiresAt },
      });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: unknown) => void): Promise<void> {
    try {
      await prisma.session.deleteMany({ where: { id: sid } });
      callback?.();
    } catch (err: unknown) {
      callback?.(err);
    }
  }

  async touch(
    sid: string,
    session: SessionData,
    callback?: () => void
  ): Promise<void> {
    try {
      const maxAgeMs = session.cookie?.maxAge ?? 1000 * 60 * 60 * 24;
      const expiresAt = new Date(Date.now() + maxAgeMs);
      await prisma.session.update({ where: { id: sid }, data: { expiresAt } });
    } catch {
      // Si la session n'existe plus, rien à faire : elle sera recréée par `set`.
    } finally {
      callback?.();
    }
  }
}
