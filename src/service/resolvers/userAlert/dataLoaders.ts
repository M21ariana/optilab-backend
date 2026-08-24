import DataLoader from "dataloader";

import {
  Alert,
  PrismaClient,
  User,
} from "../../../generated/prisma/client";


// ======================================================
// USER
// ======================================================

const userLoader =
  (db: PrismaClient) =>
  async (
    userIds: readonly number[]
  ): Promise<(User | undefined)[]> => {
    const users = await db.user.findMany({
      where: {
        id: {
          in: [...userIds],
        },
      },
    });

    return userIds.map((userId) =>
      users.find(
        (user) =>
          user.id === userId
      )
    );
  };


// ======================================================
// ALERT
// ======================================================

const alertLoader =
  (db: PrismaClient) =>
  async (
    alertIds: readonly number[]
  ): Promise<(Alert | undefined)[]> => {
    const alerts = await db.alert.findMany({
      where: {
        id: {
          in: [...alertIds],
        },
      },
    });

    return alertIds.map((alertId) =>
      alerts.find(
        (alert) =>
          alert.id === alertId
      )
    );
  };


// ======================================================
// USER ALERT DATALOADER
// ======================================================

const userAlertDataLoader = (
  db: PrismaClient
) => ({
  userLoader: new DataLoader<
    number,
    User | undefined
  >(userLoader(db)),

  alertLoader: new DataLoader<
    number,
    Alert | undefined
  >(alertLoader(db)),
});

export { userAlertDataLoader };