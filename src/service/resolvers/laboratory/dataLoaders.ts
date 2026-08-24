import DataLoader from "dataloader";

import {
  Alert,
  Organization,
  PrismaClient,
  Sample,
  StorageLocation,
} from "../../../generated/prisma/client";


// ======================================================
// ORGANIZATION LOADER
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
// STORAGE LOCATIONS LOADER
// ======================================================

const storageLocationsLoader =
  (db: PrismaClient) =>
  async (
    laboratoryIds: readonly number[]
  ): Promise<StorageLocation[][]> => {
    const storageLocations =
      await db.storageLocation.findMany({
        where: {
          laboratoryId: {
            in: [...laboratoryIds],
          },
        },
      });

    return laboratoryIds.map((laboratoryId) =>
      storageLocations.filter(
        (storageLocation) =>
          storageLocation.laboratoryId === laboratoryId
      )
    );
  };


// ======================================================
// SAMPLES LOADER
// ======================================================

const samplesLoader =
  (db: PrismaClient) =>
  async (
    laboratoryIds: readonly number[]
  ): Promise<Sample[][]> => {
    const samples = await db.sample.findMany({
      where: {
        laboratoryId: {
          in: [...laboratoryIds],
        },
      },
    });

    return laboratoryIds.map((laboratoryId) =>
      samples.filter(
        (sample) =>
          sample.laboratoryId === laboratoryId
      )
    );
  };


// ======================================================
// ALERTS LOADER
// ======================================================

const alertsLoader =
  (db: PrismaClient) =>
  async (
    laboratoryIds: readonly number[]
  ): Promise<Alert[][]> => {
    const alerts = await db.alert.findMany({
      where: {
        laboratoryId: {
          in: [...laboratoryIds],
        },
      },
    });

    return laboratoryIds.map((laboratoryId) =>
      alerts.filter(
        (alert) =>
          alert.laboratoryId === laboratoryId
      )
    );
  };


// ======================================================
// LABORATORY DATALOADER
// ======================================================

const laboratoryDataLoader = (
  db: PrismaClient
) => ({
  organizationLoader: new DataLoader<
    number,
    Organization | undefined
  >(organizationLoader(db)),

  storageLocationsLoader: new DataLoader<
    number,
    StorageLocation[]
  >(storageLocationsLoader(db)),

  samplesLoader: new DataLoader<
    number,
    Sample[]
  >(samplesLoader(db)),

  alertsLoader: new DataLoader<
    number,
    Alert[]
  >(alertsLoader(db)),
});

export { laboratoryDataLoader };