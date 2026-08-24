import DataLoader from "dataloader";

import {
  Laboratory,
  PrismaClient,
  User,
} from "../../../generated/prisma/client";

const laboratoriesLoader =
  (db: PrismaClient) =>
  async (
    organizationIds: readonly number[]
  ): Promise<Laboratory[][]> => {
    const laboratories = await db.laboratory.findMany({
      where: {
        organizationId: {
          in: [...organizationIds],
        },
      },
    });

    return organizationIds.map((organizationId) =>
      laboratories.filter(
        (laboratory) =>
          laboratory.organizationId === organizationId
      )
    );
  };

const usersLoader =
  (db: PrismaClient) =>
  async (
    organizationIds: readonly number[]
  ): Promise<User[][]> => {
    const users = await db.user.findMany({
      where: {
        organizationId: {
          in: [...organizationIds],
        },
      },
    });

    return organizationIds.map((organizationId) =>
      users.filter(
        (user) =>
          user.organizationId === organizationId
      )
    );
  };

const organizationDataLoader = (db: PrismaClient) => ({
  laboratoriesLoader: new DataLoader<number, Laboratory[]>(
    laboratoriesLoader(db)
  ),

  usersLoader: new DataLoader<number, User[]>(
    usersLoader(db)
  ),
});

export { organizationDataLoader };