import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate.js";
import { requireAdmin } from "../../../middleware/authorize.js";
import * as usersController from "../controllers/users.controller.js";

const router = Router();

// All user-management routes require admin+ (level ≥3)
router.use(authenticate, requireAdmin);

router.get("/", usersController.list);
router.post("/", usersController.create);

router.get("/:id", usersController.getById);
router.patch("/:id", usersController.update);

router.patch("/:id/activation", usersController.toggleActivation);
router.post("/:id/reset-otp", usersController.resetOTP);

export default router;