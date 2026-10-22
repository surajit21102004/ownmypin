const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 's4-coaz.crazzydns.com',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

/**
 * Test database connectivity
 * @returns {Promise<{success: boolean, message: string, details?: object}>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1 + 1 AS test_result, DATABASE() AS current_db, VERSION() AS db_version');
    
    // Fetch tables list to see current schema
    const [tables] = await connection.query('SHOW TABLES');
    
    connection.release();

    const tableNames = tables.map((row) => Object.values(row)[0]);

    return {
      success: true,
      message: 'Successfully connected to MySQL database!',
      details: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: result[0].current_db,
        version: result[0].db_version,
        tablesCount: tableNames.length,
        tables: tableNames,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to MySQL database: ${error.message}`,
      error: {
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
      },
    };
  }
}

module.exports = {
  pool,
  testConnection,
};
