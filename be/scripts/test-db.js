const { testConnection, pool } = require('../src/config/db');

async function run() {
  console.log('Testing MySQL database connection...');
  console.log(`Connecting to Host: ${process.env.DB_HOST || 's1-nnvp.crazzydns.com'} | Database: ${process.env.DB_NAME || 'ecompone_ownmypin'}...`);
  
  const startTime = Date.now();
  const res = await testConnection();
  const duration = Date.now() - startTime;

  if (res.success) {
    console.log('\x1b[32m%s\x1b[0m', ' Connection Successful!');
    console.log(`Latency: ${duration}ms`);
    console.log(`Connected Database: ${res.details.database}`);
    console.log(`MySQL Server Version: ${res.details.version}`);
    console.log(`Existing Tables (${res.details.tablesCount}):`, res.details.tables.length > 0 ? res.details.tables : '[No tables yet - database is ready for migrations/schema]');
  } else {
    console.error('\x1b[31m%s\x1b[0m', ' Connection Failed!');
    console.error(res.message);
    if (res.error) {
      console.error('Error Code:', res.error.code);
    }
  }

  // Gracefully close pool
  await pool.end();
  process.exit(res.success ? 0 : 1);
}

run();
