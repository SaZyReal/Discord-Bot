import crypto from "node:crypto";
import { Router } from "express";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchDiscordUser,
} from "../../services/discordOAuthService";

export function createAuthRouter(): Router {
  const router = Router();

  router.get("/login", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    req.session.oauthState = state;
    res.redirect(buildAuthorizeUrl(state));
  });

  router.get("/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect("/auth/login");
    }

    if (typeof code !== "string" || typeof state !== "string" || state !== req.session.oauthState) {
      return res.status(400).render("error", {
        title: "Connexion invalide",
        message: "La requête de connexion est invalide ou a expiré. Réessaie.",
      });
    }
    req.session.oauthState = undefined;

    try {
      const accessToken = await exchangeCodeForToken(code);
      const discordUser = await fetchDiscordUser(accessToken);

      req.session.user = {
        id: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
      };

      res.redirect("/dashboard");
    } catch (err) {
      console.error("[auth] échec de la connexion OAuth2 :", err);
      res.status(500).render("error", {
        title: "Connexion impossible",
        message: "Une erreur est survenue pendant la connexion à Discord. Réessaie.",
      });
    }
  });

  router.post("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
  });

  return router;
}
