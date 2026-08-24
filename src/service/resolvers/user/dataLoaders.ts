import DataLoader from "dataloader";

import {
  Organization,
  PrismaClient,
  SampleMovement,
  UserAlert,
} from "../../../generated/prisma/client";


// ======================================================
// ORGANIZATION
// ======================================================

const organizationLoader =
  (db: PrismaClient) =>
  async (
    organizationIds: readonly number[]
  ): Promise<(Organization | undefined)[]> => {
    const organizations =
      await db.organization.findMany({
        where: {
          id: {
            in: [...organizationIds],
          },
        },
      });

    return organizationIds.map((organizationId) =>
      organizations.find(
        (organization) =>
          organization.id === organizationId
      )
    );
  };


// ======================================================
// SAMPLE MOVEMENTS
// ======================================================

const movementsLoader =
  (db: PrismaClient) =>
  async (
    userIds: readonly number[]
  ): Promise<SampleMovement[][]> => {
    const movements =
      await db.sampleMovement.findMany({
        where: {
          performedByUserId: {
            in: [...userIds],
          },
        },
      });

    return userIds.map((userId) =>
      movements.filter(
        (movement) =>
          movement.performedByUserId === userId
      )
    );
  };


// ======================================================
// USER ALERTS
// ======================================================

const userAlertsLoader =
  (db: PrismaClient) =>
  async (
    userIds: readonly number[]
  ): Promise<UserAlert[][]> => {
    const userAlerts =
      await db.userAlert.findMany({
        where: {
          userId: {
            in: [...userIds],
          },
        },
      });

    return userIds.map((userId) =>
      userAlerts.filter(
        (userAlert) =>
          userAlert.userId === userId
      )
    );
  };


// ======================================================
// USER DATALOADER
// ======================================================

const userDataLoader = (
  db: PrismaClient
) => ({
  organizationLoader: new DataLoader<
    number,
    Organization | undefined
  >(organizationLoader(db)),

  movementsLoader: new DataLoader<
    number,
    SampleMovement[]
  >(movementsLoader(db)),

  userAlertsLoader: new DataLoader<
    number,
    UserAlert[]
  >(userAlertsLoader(db)),
});

export { userDataLoader };