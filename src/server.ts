import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

app.listen(env.port, () => {
  logger.info(`Server is running on port ${env.port}`);
  logger.info(`API URL: http://localhost:${env.port}/api`);
  logger.info(`Environment: ${env.nodeEnv}`);
});
