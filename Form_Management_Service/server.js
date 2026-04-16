const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const fieldOptionsRoutes = require('./routes/fieldOptionsRoutes');
const dynamicMappingsRoutes = require('./routes/dynamicMappingsRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required. Please set it in your environment variables.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Form Management Service',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/field-options', fieldOptionsRoutes);
app.use('/api/dynamic-mappings', dynamicMappingsRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/category-management', categoryRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Use standardized response helper if available
  const { errorResponse } = require('./utils/responseHelper');
  return errorResponse(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500,
    'error',
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
});

// 404 handler
app.use('*', (req, res) => {
  const { notFoundResponse } = require('./utils/responseHelper');
  return notFoundResponse(res, 'Route not found');
});

app.listen(PORT, () => {
  console.log(`Form Management Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 
