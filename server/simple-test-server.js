const express = require('express');
const cors = require('cors');
const assessmentsRoutes = require('./routes/assessments');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Simple test server is working!' });
});

// Register the assessments router
app.use('/api/assessments', assessmentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log('Test endpoints:');
  console.log(`  - GET http://localhost:${PORT}/test`);
  console.log(`  - GET http://localhost:${PORT}/api/assessments/test`);
  console.log(`  - GET http://localhost:${PORT}/api/assessments/faculty/6`);
}); 