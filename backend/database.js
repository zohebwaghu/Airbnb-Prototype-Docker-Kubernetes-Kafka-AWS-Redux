const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'airbnb_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return DECIMAL and BIGINT as numbers so frontend math works as expected
  decimalNumbers: true
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    // Read and execute schema file
    const fs = require('fs').promises;
    const path = require('path');

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');

    // Split by semicolon to execute each statement separately
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.execute(statement);
        } catch (error) {
          // If table already exists, continue (this is expected in development)
          if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
            throw error;
          }
        }
      }
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
