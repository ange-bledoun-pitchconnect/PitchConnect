/**
 * ============================================================================
 * 🧪 PITCHCONNECT - DATABASE CONNECTION TEST v2.0
 * ============================================================================
 * Path: /test-db.js
 *
 * Quick script to test database connectivity
 * Run with: node test-db.js
 *
 * Prisma 7 compatible - requires explicit datasourceUrl
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');

// ============================================================================
// 🔧 CONFIGURATION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('');
  console.error('═'.repeat(60));
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('═'.repeat(60));
  console.error('');
  console.error('Please set it in your .env file:');
  console.error('DATABASE_URL="postgresql://user:password@host:5432/database"');
  console.error('');
  console.error('Or run with:');
  console.error('DATABASE_URL="your-connection-string" node test-db.js');
  console.error('');
  process.exit(1);
}

// ============================================================================
// 🏭 PRISMA CLIENT (Prisma 7 compatible)
// ============================================================================

const prisma = new PrismaClient({
  // ✅ PRISMA 7 REQUIREMENT: Explicit datasource URL
  datasourceUrl: DATABASE_URL,

  // Verbose logging for debugging
  log: [
    { level: 'query', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],

  // Pretty errors for development
  errorFormat: 'pretty',
});

// ============================================================================
// 🧪 TEST FUNCTIONS
// ============================================================================

/**
 * Test basic database connectivity
 */
async function testConnection() {
  console.log('');
  console.log('═'.repeat(60));
  console.log('🔄 PITCHCONNECT - Database Connection Test');
  console.log('═'.repeat(60));
  console.log('');

  const startTime = Date.now();

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣  Testing basic connectivity...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Basic query successful:', result);

    // Test 2: Get database version
    console.log('');
    console.log('2️⃣  Getting database version...');
    const versionResult = await prisma.$queryRaw`SELECT version()`;
    const version = versionResult[0]?.version?.split(' ').slice(0, 2).join(' ') || 'Unknown';
    console.log('   ✅ Database version:', version);

    // Test 3: Check current database
    console.log('');
    console.log('3️⃣  Checking current database...');
    const dbResult = await prisma.$queryRaw`SELECT current_database()`;
    console.log('   ✅ Current database:', dbResult[0]?.current_database);

    // Test 4: List tables
    console.log('');
    console.log('4️⃣  Listing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('   ✅ Tables found:', tables.length);
    if (tables.length > 0) {
      tables.forEach((t, i) => {
        console.log(`      ${String(i + 1).padStart(2)}. ${t.table_name}`);
      });
    } else {
      console.log('   ⚠️  No tables found. Run: npx prisma migrate dev');
    }

    // Test 5: Count users (if table exists)
    console.log('');
    console.log('5️⃣  Checking User table...');
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ User count: ${userCount}`);
    } catch (e) {
      console.log('   ⚠️  User table not accessible (may need migration)');
    }

    // Test 6: Check schema sync
    console.log('');
    console.log('6️⃣  Checking Prisma schema sync...');
    await testSchemaSync();

    // Summary
    const elapsed = Date.now() - startTime;
    console.log('');
    console.log('═'.repeat(60));
    console.log(`✅ ALL TESTS PASSED (${elapsed}ms)`);
    console.log('═'.repeat(60));
    console.log('');

    return true;
  } catch (error) {
    console.log('');
    console.log('═'.repeat(60));
    console.error('❌ DATABASE CONNECTION FAILED');
    console.log('═'.repeat(60));
    console.log('');
    console.error('Error:', error.message);
    console.log('');

    // Provide helpful error messages
    printErrorHelp(error);

    return false;
  }
}

/**
 * Test Prisma schema sync
 */
async function testSchemaSync() {
  const models = [
    { name: 'user', label: 'User' },
    { name: 'club', label: 'Club' },
    { name: 'team', label: 'Team' },
    { name: 'player', label: 'Player' },
    { name: 'coach', label: 'Coach' },
    { name: 'match', label: 'Match' },
    { name: 'league', label: 'League' },
    { name: 'subscription', label: 'Subscription' },
  ];

  const available = [];
  const missing = [];

  for (const model of models) {
    try {
      if (prisma[model.name]) {
        await prisma[model.name].findFirst({ take: 1 });
        available.push(model.label);
      } else {
        missing.push(model.label);
      }
    } catch {
      missing.push(model.label);
    }
  }

  if (available.length > 0) {
    console.log('   ✅ Available models:', available.join(', '));
  }
  if (missing.length > 0) {
    console.log('   ⚠️  Missing/inaccessible:', missing.join(', '));
  }
}

/**
 * Print helpful error messages
 */
function printErrorHelp(error) {
  const message = error.message || '';

  if (message.includes('ECONNREFUSED')) {
    console.log('💡 Tip: Database server is not running or not accessible');
    console.log('   - Check if PostgreSQL is running');
    console.log('   - Verify host and port in DATABASE_URL');
    console.log('   - Check firewall settings');
  } else if (message.includes('authentication failed') || message.includes('password')) {
    console.log('💡 Tip: Invalid credentials');
    console.log('   - Check username and password in DATABASE_URL');
    console.log('   - Verify user has access to the database');
  } else if (message.includes('does not exist')) {
    console.log('💡 Tip: Database does not exist');
    console.log('   - Create the database first: createdb yourdbname');
    console.log('   - Or run: npx prisma migrate dev');
  } else if (message.includes('SSL') || message.includes('ssl')) {
    console.log('💡 Tip: SSL connection issue');
    console.log('   - For cloud DBs: Add ?sslmode=require to DATABASE_URL');
    console.log('   - For local dev: Add ?sslmode=disable');
  } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    console.log('💡 Tip: Connection timeout');
    console.log('   - Check network connectivity');
    console.log('   - Verify the host is reachable');
    console.log('   - Check VPN if connecting to private network');
  } else if (message.includes('PrismaClientInitializationError')) {
    console.log('💡 Tip: Prisma client initialization failed');
    console.log('   - Run: npx prisma generate');
    console.log('   - Check DATABASE_URL format');
  }

  console.log('');
  console.log('📚 For more help:');
  console.log('   - Prisma Docs: https://www.prisma.io/docs');
  console.log('   - Check .env file configuration');
  console.log('');
}

/**
 * Test connection pooling (optional)
 */
async function testConnectionPooling() {
  console.log('');
  console.log('7️⃣  Testing connection pooling (10 concurrent queries)...');

  const start = Date.now();
  const promises = Array.from({ length: 10 }, (_, i) =>
    prisma.$queryRaw`SELECT ${i + 1} as query_num, pg_sleep(0.1)`
  );

  try {
    await Promise.all(promises);
    const elapsed = Date.now() - start;
    console.log(`   ✅ Pooling test passed (${elapsed}ms for 10 queries)`);
    console.log(`   ℹ️  Sequential would be ~1000ms, got ${elapsed}ms`);
  } catch (error) {
    console.log('   ⚠️  Pooling test failed:', error.message);
  }
}

// ============================================================================
// 🚀 MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('');
  console.log('🏈 PITCHCONNECT - Database Test v2.0');
  console.log('════════════════════════════════════');
  console.log('');
  console.log('📍 Database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('📍 Node Version:', process.version);
  console.log('📍 Timestamp:', new Date().toISOString());
  console.log('');

  try {
    const connected = await testConnection();

    if (connected && process.argv.includes('--pool')) {
      await testConnectionPooling();
    }
  } finally {
    console.log('🔌 Disconnecting...');
    await prisma.$disconnect();
    console.log('✅ Disconnected');
    console.log('');
  }
}

// Run the test
main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});