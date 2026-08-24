import DataLoader from "dataloader";

import {
  PrismaClient,
  Sample,
  StorageLocation,
  User,
} from "../../../generated/prisma/client";


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
// FROM LOCATION
// ======================================================

const fromLocationLoader =
  (db: PrismaClient) =>
  async (
    locationIds: readonly number[]
  ): Promise<(StorageLocation | undefined)[]> => {
    const locations =
      await db.storageLocation.findMany({
        where: {
          id: {
            in: [...locationIds],
          },
        },
      });

    return locationIds.map((locationId) =>
      locations.find(
        (location) =>
          location.id === locationId
      )
    );
  };


// ======================================================
// TO LOCATION
// ======================================================

const toLocationLoader =
  (db: PrismaClient) =>
  async (
    locationIds: readonly number[]
  ): Promise<(StorageLocation | undefined)[]> => {
    const locations =
      await db.storageLocation.findMany({
        where: {
          id: {
            in: [...locationIds],
          },
        },
      });

    return locationIds.map((locationId) =>
      locations.find(
        (location) =>
          location.id === locationId
      )
    );
  };


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
// SAMPLE MOVEMENT DATALOADER
// ======================================================

const sampleMovementDataLoader = (
  db: PrismaClient
) => ({
  sampleLoader: new DataLoader<
    number,
    Sample | undefined
  >(sampleLoader(db)),

  fromLocationLoader: new DataLoader<
    number,
    StorageLocation | undefined
  >(fromLocationLoader(db)),

  toLocationLoader: new DataLoader<
    number,
    StorageLocation | undefined
  >(toLocationLoader(db)),

  userLoader: new DataLoader<
    number,
    User | undefined
  >(userLoader(db)),
});

export { sampleMovementDataLoader };