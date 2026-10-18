import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma, verifyDatabaseConnection } from "./lib/prisma.js";

async function startServer(): Promise<void> {
  try {
    await verifyDatabaseConnection();
    logger.info("Database connection established");

    app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
      logger.info(`API URL: http://localhost:${env.port}/api`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });
  } catch {
    logger.error("Database connection failed. Server startup aborted.");
    await prisma.$disconnect();
    process.exitCode = 1;
  }
}

void startServer();
