import { config } from './config.js';
import { MonitorManager } from './services/MonitorManager.js';
import { createServer } from './api/server.js';

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║       Steam Monitor Service           ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log();

  const manager = new MonitorManager();
  const app = await createServer(manager);

  // Log monitor events
  manager.on('log', (msg: string) => {
    app.log.info(msg);
  });

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    manager.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start the API server
  await app.listen({ port: config.port, host: config.host });

  console.log();
  console.log(`  API:       http://localhost:${config.port}/api/v1/status`);
  console.log(`  WebSocket: ws://localhost:${config.port}/ws`);
  console.log(`  Health:    http://localhost:${config.port}/api/v1/health`);
  console.log();

  // Start all monitors (after server is listening)
  await manager.start();
  app.log.info('All monitors started');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
