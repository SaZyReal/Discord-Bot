import path from "node:path";
import express, { Express } from "express";
import session from "express-session";
import { Client } from "discord.js";
import { env } from "../config/env";
import { PrismaSessionStore } from "../database/sessionStore";
import { createAuthRouter } from "./routes/auth";
import { createDashboardRouter } from "./routes/dashboard";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createWebApp(client: Client): Express {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  // Nécessaire derrière un reverse proxy (Nginx, etc.) en production pour que
  // les cookies "secure" et la détection HTTPS fonctionnent correctement.
  app.set("trust proxy", 1);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "..", "..", "public")));

  app.use(
    session({
      store: new PrismaSessionStore(),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
      },
    })
  );

  app.get("/", (req, res) => {
    if (req.session.user) return res.redirect("/dashboard");
    res.render("login");
  });

  app.use("/auth", createAuthRouter());
  app.use("/dashboard", createDashboardRouter(client));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
