import DataLoader from "dataloader";

import {
  Laboratory,
  PrismaClient,
  Sample,
  StorageLocation,
  UserAlert,
} from "../../../generated/prisma/client";


// ======================================================
// LABORATORY
// ======================================================

const laboratoryLoader =
  (db: PrismaClient) =>
  async (
    laboratoryIds: readonly number[]
  ): Promise<(Laboratory | undefined)[]> => {
    const laboratories =
      await db.laboratory.findMany({
        where: {
          id: {
            in: [...laboratoryIds],
          },
        },
      });

    return laboratoryIds.map((laboratoryId) =>
      laboratories.find(
        (laboratory) =>
          laboratory.id === laboratoryId
      )
    );
  };


// ======================================================
// STORAGE LOCATION
// ======================================================

const storageLocationLoader =
  (db: PrismaClient) =>
  async (
    storageLocationIds: readonly number[]
  ): Promise<(StorageLocation | undefined)[]> => {
    const storageLocations =
      await db.storageLocation.findMany({
        where: {
          id: {
            in: [...storageLocationIds],
          },
        },
      });

    return storageLocationIds.map(
      (storageLocationId) =>
        storageLocations.find(
          (storageLocation) =>
            storageLocation.id === storageLocationId
        )
    );
  };


// ======================================================
// SAMPLE
// ======================================================

const sampleLoader =
  (db: PrismaClient) =>
  async (
    sampleIds: readonly number[]
  ): Promise<(Sample | undefined)[]> => {
    const samples = await db.sample.findMany({
      where: {
        id: {
          in: [...sampleIds],
        },
      },
    });

    return sampleIds.map((sampleId) =>
      samples.find(
        (sample) =>
          sample.id === sampleId
      )
    );
  };


// ======================================================
// USER ALERTS
// ======================================================

const userAlertsLoader =
  (db: PrismaClient) =>
  async (
    alertIds: readonly number[]
  ): Promise<UserAlert[][]> => {
    const userAlerts =
      await db.userAlert.findMany({
        where: {
          alertId: {
            in: [...alertIds],
          },
        },
      });

    return alertIds.map((alertId) =>
      userAlerts.filter(
        (userAlert) =>
          userAlert.alertId === alertId
      )
    );
  };


// ======================================================
// ALERT DATALOADER
// ======================================================

const alertDataLoader = (
  db: PrismaClient
) => ({
  laboratoryLoader: new DataLoader<
    number,
    Laboratory | undefined
  >(laboratoryLoader(db)),

  storageLocationLoader: new DataLoader<
    number,
    StorageLocation | undefined
  >(storageLocationLoader(db)),

  sampleLoader: new DataLoader<
    number,
    Sample | undefined
  >(sampleLoader(db)),

  userAlertsLoader: new DataLoader<
    number,
    UserAlert[]
  >(userAlertsLoader(db)),
});

export { alertDataLoader };