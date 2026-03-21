const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Protect sensitive files from static serving
const sensitiveFiles = ['.env', 'server.js', 'package.json', 'package-lock.json', 'vercel.json', 'supabase_setup.md'];
const sensitiveDirs = ['/routes', '/controllers', '/models', '/config', '/middleware', '/services'];

app.use((req, res, next) => {
  const reqPath = req.path;
  const isSensitiveFile = sensitiveFiles.some(file => reqPath === `/${file}`);
  const isSensitiveDir = sensitiveDirs.some(dir => reqPath.startsWith(dir));
  
  if (isSensitiveFile || isSensitiveDir) {
    return res.status(403).send('Forbidden');
  }
  next();
});

// Serve static frontend files from the root directory
app.use(express.static(__dirname));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

// Export app for serverless deployment (Vercel)
module.exports = app;

// Only listen if not running in a Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
