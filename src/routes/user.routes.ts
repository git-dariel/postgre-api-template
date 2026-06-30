import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middlewares/validateBody.js";

const router = Router();

const userController = new UserController();

router.get("/", asyncHandler(userController.getAllUsers));
router.get("/:id", asyncHandler(userController.getUserById));
router.post("/", validateBody("email", "password"), asyncHandler(userController.createUser));
router.patch("/:id", asyncHandler(userController.updateUser));
router.delete("/:id", asyncHandler(userController.deleteUser));

export default router;
