import DataLoader from "dataloader";

import {
  Alert,
  Laboratory,
  MaterialType,
  PrismaClient,
  SampleMovement,
  StorageLocation,
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
// MATERIAL TYPE
// ======================================================

const materialTypeLoader =
  (db: PrismaClient) =>
  async (
    materialTypeIds: readonly number[]
  ): Promise<(MaterialType | undefined)[]> => {
    const materialTypes =
      await db.materialType.findMany({
        where: {
          id: {
            in: [...materialTypeIds],
          },
        },
      });

    return materialTypeIds.map((materialTypeId) =>
      materialTypes.find(
        (materialType) =>
          materialType.id === materialTypeId
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
            storageLocation.id ===
            storageLocationId
        )
    );
  };


// ======================================================
// MOVEMENTS
// ======================================================

const movementsLoader =
  (db: PrismaClient) =>
  async (
    sampleIds: readonly number[]
  ): Promise<SampleMovement[][]> => {
    const movements =
      await db.sampleMovement.findMany({
        where: {
          sampleId: {
            in: [...sampleIds],
          },
        },
      });

    return sampleIds.map((sampleId) =>
      movements.filter(
        (movement) =>
          movement.sampleId === sampleId
      )
    );
  };


// ======================================================
// ALERTS
// ======================================================

const alertsLoader =
  (db: PrismaClient) =>
  async (
    sampleIds: readonly number[]
  ): Promise<Alert[][]> => {
    const alerts = await db.alert.findMany({
      where: {
        sampleId: {
          in: [...sampleIds],
        },
      },
    });

    return sampleIds.map((sampleId) =>
      alerts.filter(
        (alert) =>
          alert.sampleId === sampleId
      )
    );
  };


// ======================================================
// SAMPLE DATALOADER
// ======================================================

const sampleDataLoader = (
  db: PrismaClient
) => ({
  laboratoryLoader: new DataLoader<
    number,
    Laboratory | undefined
  >(laboratoryLoader(db)),

  materialTypeLoader: new DataLoader<
    number,
    MaterialType | undefined
  >(materialTypeLoader(db)),

  storageLocationLoader: new DataLoader<
    number,
    StorageLocation | undefined
  >(storageLocationLoader(db)),

  movementsLoader: new DataLoader<
    number,
    SampleMovement[]
  >(movementsLoader(db)),

  alertsLoader: new DataLoader<
    number,
    Alert[]
  >(alertsLoader(db)),
});

export { sampleDataLoader };