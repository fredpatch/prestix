import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

router.post("/set-password", authenticate, authController.setPassword);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

export default router;