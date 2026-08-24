import DataLoader from "dataloader";

import {
  Alert,
  Laboratory,
  PrismaClient,
  Sample,
  SampleMovement,
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
// SAMPLES
// ======================================================

const samplesLoader =
  (db: PrismaClient) =>
  async (
    storageLocationIds: readonly number[]
  ): Promise<Sample[][]> => {
    const samples = await db.sample.findMany({
      where: {
        storageLocationId: {
          in: [...storageLocationIds],
        },
      },
    });

    return storageLocationIds.map(
      (storageLocationId) =>
        samples.filter(
          (sample) =>
            sample.storageLocationId ===
            storageLocationId
        )
    );
  };


// ======================================================
// ALERTS
// ======================================================

const alertsLoader =
  (db: PrismaClient) =>
  async (
    storageLocationIds: readonly number[]
  ): Promise<Alert[][]> => {
    const alerts = await db.alert.findMany({
      where: {
        storageLocationId: {
          in: [...storageLocationIds],
        },
      },
    });

    return storageLocationIds.map(
      (storageLocationId) =>
        alerts.filter(
          (alert) =>
            alert.storageLocationId ===
            storageLocationId
        )
    );
  };


// ======================================================
// MOVEMENTS FROM
// ======================================================

const movementsFromLoader =
  (db: PrismaClient) =>
  async (
    storageLocationIds: readonly number[]
  ): Promise<SampleMovement[][]> => {
    const movements =
      await db.sampleMovement.findMany({
        where: {
          fromLocationId: {
            in: [...storageLocationIds],
          },
        },
      });

    return storageLocationIds.map(
      (storageLocationId) =>
        movements.filter(
          (movement) =>
            movement.fromLocationId ===
            storageLocationId
        )
    );
  };


// ======================================================
// MOVEMENTS TO
// ======================================================

const movementsToLoader =
  (db: PrismaClient) =>
  async (
    storageLocationIds: readonly number[]
  ): Promise<SampleMovement[][]> => {
    const movements =
      await db.sampleMovement.findMany({
        where: {
          toLocationId: {
            in: [...storageLocationIds],
          },
        },
      });

    return storageLocationIds.map(
      (storageLocationId) =>
        movements.filter(
          (movement) =>
            movement.toLocationId ===
            storageLocationId
        )
    );
  };


// ======================================================
// STORAGE LOCATION DATALOADER
// ======================================================

const storageLocationDataLoader = (
  db: PrismaClient
) => ({
  laboratoryLoader: new DataLoader<
    number,
    Laboratory | undefined
  >(laboratoryLoader(db)),

  samplesLoader: new DataLoader<
    number,
    Sample[]
  >(samplesLoader(db)),

  alertsLoader: new DataLoader<
    number,
    Alert[]
  >(alertsLoader(db)),

  movementsFromLoader: new DataLoader<
    number,
    SampleMovement[]
  >(movementsFromLoader(db)),

  movementsToLoader: new DataLoader<
    number,
    SampleMovement[]
  >(movementsToLoader(db)),
});

export { storageLocationDataLoader };