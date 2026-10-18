import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSocket } from './utils/socket';

const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`HRMS API listening on http://localhost:${env.PORT}`);
});
