require('dotenv').config();
const createApp = require('./app');
const { connectDatabase } = require('./lib/db');
const { ensureDatabaseSeeded } = require('./services/hoaService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await ensureDatabaseSeeded();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`HOA server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();
