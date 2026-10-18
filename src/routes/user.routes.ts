import { Router } from "express";
import userController from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateBody.js";

const router = Router();

router.get("/", asyncHandler(userController.getAll));
router.get("/:id", asyncHandler(userController.getById));
router.post("/", validateBody("email", "password"), asyncHandler(userController.create));
router.patch("/:id", asyncHandler(userController.update));
router.delete("/:id", asyncHandler(userController.remove));

export default router;
