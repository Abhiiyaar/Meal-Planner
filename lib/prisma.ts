import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // In production, create a new instance with connection pooling
  prisma = new PrismaClient({
    log: ['error'],
    // Add connection pooling settings for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
}

export { prisma };

