const createApp = require('./server/src/app');
const { connectDatabase } = require('./server/src/lib/db');
const { ensureDatabaseSeeded } = require('./server/src/services/hoaService');

let appInstance = null;
let setupPromise = null;

async function bootstrap() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await connectDatabase();
      await ensureDatabaseSeeded();
      appInstance = createApp();
      return appInstance;
    })();
  }

  return setupPromise;
}

module.exports = async (request, response) => {
  try {
    const app = appInstance || (await bootstrap());
    return app(request, response);
  } catch (error) {
    console.error(`Vercel API bootstrap failed: ${error.message}`);
    return response.status(500).json({
      message: 'Server startup failed.',
    });
  }
};
