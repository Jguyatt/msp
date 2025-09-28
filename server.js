const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('contracts.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Create tables if they don't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clerk_id TEXT UNIQUE,
        email TEXT UNIQUE,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        vendor TEXT NOT NULL,
        contract_name TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        value_cents INTEGER DEFAULT 0,
        contact_email TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    db.run(`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contract_id INTEGER,
        stage INTEGER NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'SENT',
        error TEXT,
        FOREIGN KEY (contract_id) REFERENCES contracts (id)
      )
    `);
  }
});

// Helper function to get user ID from Clerk (simplified for demo)
const getUserId = (req) => {
  // In production, you'd verify the Clerk JWT token here
  // For demo purposes, we'll use a default user ID
  return 1;
};

// API Routes

// Get contracts for a user
app.get('/api/contracts', (req, res) => {
  const userId = getUserId(req);
  
  db.all(
    'SELECT * FROM contracts WHERE user_id = ? ORDER BY end_date ASC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Add calculated fields
      const contracts = rows.map(contract => {
        const endDate = new Date(contract.end_date);
        const today = new Date();
        const daysUntil = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...contract,
          daysUntil,
          reminders: {
            d90: Math.random() > 0.3, // Mock data
            d60: Math.random() > 0.5,
            d30: Math.random() > 0.7
          }
        };
      });
      
      res.json({ contracts });
    }
  );
});

// Upload CSV file
app.post('/api/contracts/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const userId = getUserId(req);
  const contracts = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Validate required fields
      if (!row.Vendor || !row['Contract Name'] || !row['Start Date'] || !row['End Date'] || !row['Contact Email']) {
        errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
        return;
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row['Contact Email'])) {
        errors.push(`Invalid email in row: ${row['Contact Email']}`);
        return;
      }
      
      // Validate dates
      const startDate = new Date(row['Start Date']);
      const endDate = new Date(row['End Date']);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push(`Invalid date format in row: Start: ${row['Start Date']}, End: ${row['End Date']}`);
        return;
      }
      
      // Parse value
      const value = parseFloat(row['Value (USD)']) || 0;
      const valueCents = Math.round(value * 100);
      
      contracts.push({
        user_id: userId,
        vendor: row.Vendor.trim(),
        contract_name: row['Contract Name'].trim(),
        start_date: row['Start Date'],
        end_date: row['End Date'],
        value_cents: valueCents,
        contact_email: row['Contact Email'].trim()
      });
    })
    .on('end', () => {
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      
      if (errors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation errors', 
          errors,
          contracts: contracts.length 
        });
      }
      
      if (contracts.length === 0) {
        return res.status(400).json({ error: 'No valid contracts found in CSV' });
      }
      
      // Insert contracts into database
      const stmt = db.prepare(`
        INSERT INTO contracts (user_id, vendor, contract_name, start_date, end_date, value_cents, contact_email)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      let inserted = 0;
      contracts.forEach(contract => {
        stmt.run([
          contract.user_id,
          contract.vendor,
          contract.contract_name,
          contract.start_date,
          contract.end_date,
          contract.value_cents,
          contract.contact_email
        ], (err) => {
          if (err) {
            console.error('Error inserting contract:', err);
          } else {
            inserted++;
          }
        });
      });
      
      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing statement:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ 
          message: 'Contracts uploaded successfully',
          count: inserted,
          contracts: contracts.length
        });
      });
    })
    .on('error', (err) => {
      console.error('CSV parsing error:', err);
      res.status(500).json({ error: 'Error parsing CSV file' });
    });
});

// Get KPI data
app.get('/api/kpis', (req, res) => {
  const userId = getUserId(req);
  
  const queries = {
    totalContracts: 'SELECT COUNT(*) as count FROM contracts WHERE user_id = ?',
    expiringThisMonth: `
      SELECT COUNT(*) as count FROM contracts 
      WHERE user_id = ? AND end_date BETWEEN date('now') AND date('now', '+1 month')
    `,
    remindersSent: `
      SELECT COUNT(*) as count FROM reminder_logs rl
      JOIN contracts c ON rl.contract_id = c.id
      WHERE c.user_id = ? AND rl.sent_at >= date('now', '-7 days')
    `
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [userId], (err, row) => {
      if (err) {
        console.error(`Error in ${key} query:`, err);
        results[key] = 0;
      } else {
        results[key] = row.count;
      }
      
      completed++;
      if (completed === total) {
        // Calculate estimated savings (mock calculation)
        const expiringSoon = results.expiringThisMonth;
        const estimatedSavings = expiringSoon * 200; // $200 per contract
        
        res.json({
          totalContracts: results.totalContracts,
          expiringThisMonth: results.expiringThisMonth,
          remindersSentThisWeek: results.remindersSent,
          estimatedSavings
        });
      }
    });
  });
});

// Serve React app for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
