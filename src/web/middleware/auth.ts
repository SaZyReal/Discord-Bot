import { Client } from "discord.js";
import { NextFunction, Request, Response } from "express";
import { isBotAdmin } from "../../services/adminService";

/** Bloque l'accès si aucun utilisateur n'est connecté. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  next();
}

/**
 * Bloque l'accès si l'utilisateur connecté n'administre pas le serveur
 * demandé (:guildId dans l'URL). La vérification est refaite à chaque
 * requête directement auprès du bot — on ne fait jamais confiance à un
 * état mis en cache côté session pour une action sensible.
 */
export function requireGuildAdmin(client: Client) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guildId = req.params.guildId;
      const userId = req.session.user?.id;

      if (!userId) {
        return res.redirect("/auth/login");
      }

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        return res.status(404).render("error", {
          title: "Serveur introuvable",
          message: "Le bot n'est pas présent sur ce serveur (ou l'identifiant est incorrect).",
        });
      }

      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member || !(await isBotAdmin(member))) {
        return res.status(403).render("error", {
          title: "Accès refusé",
          message: "Tu n'as pas la permission d'administrer ce serveur.",
        });
      }

      res.locals.guild = guild;
      next();
    } catch (err) {
      next(err);
    }
  };
}
