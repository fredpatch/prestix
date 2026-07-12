// src/types/express.d.ts

import { TokenPayload } from "@/utils/jwt";

// ── Extension du type Request d'Express ──────────────────────────────────
// On ajoute 'user' à l'objet request pour le rendre accessible
// dans tous les handlers de route après ce middleware
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      // file?: Express.Multer.File; // Ajout de la propriété 'file' pour Multer
    }
  }
}

// Rendre ce fichier un module pour éviter les erreurs de portée globale
export {};
