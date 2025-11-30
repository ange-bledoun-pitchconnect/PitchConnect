const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Database connection successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
