import { PrismaClient } from "../generated/prisma/client";

type db = PrismaClient;

interface Context {
  db: db;
  token?: string;
  origin?: string;
  ip?: string;
  user?: {
    id: number;
    auth0Id?: string;
  };
}

interface ResolverFunction {
  [key: string]: (
    parent: any,
    args: any,
    context: Context
  ) => Promise<any>;
}

interface Resolver {
  Query: ResolverFunction;
  Mutation: ResolverFunction;
  [key: string]: ResolverFunction;
}

export {
  Resolver,
  db,
  Context,
};