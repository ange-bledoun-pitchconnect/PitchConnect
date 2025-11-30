import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = global.prisma ?? prismaClientSingleton();

export { db };
export default db;

if (process.env.NODE_ENV !== 'production') global.prisma = db;
