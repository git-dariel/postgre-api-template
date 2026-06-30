import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(requestLogger);
app.use(express.json());

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);
