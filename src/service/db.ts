import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const db = new PrismaClient({
  adapter,
});

const getDB = async () => {
  return db;
};

export { db, getDB };