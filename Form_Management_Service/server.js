const connectDB = require('./config/database');
const { appConfig, validateRequiredConfig } = require('./config/appConfig');
const createApp = require('./app');

validateRequiredConfig();

const app = createApp();
const PORT = appConfig.port;

connectDB().catch((error) => {
  console.error('MongoDB connection failed:', error.message);
});

app.listen(PORT, () => {
  console.log(`Form Management Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Email provider: ${appConfig.email.provider}`);
});

module.exports = app;
