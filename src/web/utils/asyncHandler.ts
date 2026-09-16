import { NextFunction, Request, Response } from "express";

/**
 * Express 4 ne transmet pas automatiquement les rejets de Promise au
 * middleware d'erreur. On enveloppe donc chaque handler async avec cette
 * fonction pour que toute exception non rattrapée finisse bien dans
 * errorHandler plutôt que de faire planter le process ou de bloquer la requête.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
