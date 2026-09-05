import app from './app.js';
import { connectDatabase } from './config/database.js';
import { assertRuntimeEnvironment, env } from './config/env.js';
import { BootstrapAdminService } from './modules/users/bootstrapAdmin.service.js';

const startServer = async () => {
  try {
    assertRuntimeEnvironment();
    await connectDatabase();
    await BootstrapAdminService.provision();
    app.listen(env.port, () => {
      console.info(`PeoplePay360 API listening on port ${env.port}.`);
    });
  } catch {
    console.error('PeoplePay360 API failed to start.');
    process.exitCode = 1;
  }
};

startServer();
