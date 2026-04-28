import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./database/connection.js";

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
    console.log(`API URL: http://localhost:${env.port}/api`);
  });
}

startServer();
