import morgan from "morgan";
import { logger } from "../lib/logger";

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan("short", { stream });

