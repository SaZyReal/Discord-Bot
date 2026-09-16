import { NextFunction, Request, Response } from "express";

/**
 * Filet de sécurité final : si une route lève une exception non gérée,
 * on log l'erreur complète côté serveur mais on ne montre jamais la stack
 * trace ou le message brut de Node à l'utilisateur.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error("[web] erreur non gérée :", err);

  if (res.headersSent) return;

  res.status(500).render("error", {
    title: "Erreur inattendue",
    message: "Une erreur inattendue est survenue. Réessaie dans quelques instants.",
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).render("error", {
    title: "Page introuvable",
    message: "Cette page n'existe pas.",
  });
}
