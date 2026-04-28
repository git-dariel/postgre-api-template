import { Router } from "express";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "API is running",
  });
});

router.use("/users", userRoutes);

export default router;
