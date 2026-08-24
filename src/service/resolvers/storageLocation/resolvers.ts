import { Resolver } from "../../types";
import { storageLocationDataLoader } from "./dataLoaders";
import { getWhereInStorageLocations } from "./transformations";

const storageLocationResolvers: Resolver = {
  StorageLocation: {
    laboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await storageLocationDataLoader(db)
        .laboratoryLoader
        .load(parent.laboratoryId);
    },

    samples: async (
      parent,
      args,
      { db }
    ) => {
      return await storageLocationDataLoader(db)
        .samplesLoader
        .load(parent.id);
    },

    alerts: async (
      parent,
      args,
      { db }
    ) => {
      return await storageLocationDataLoader(db)
        .alertsLoader
        .load(parent.id);
    },

    movementsFrom: async (
      parent,
      args,
      { db }
    ) => {
      return await storageLocationDataLoader(db)
        .movementsFromLoader
        .load(parent.id);
    },

    movementsTo: async (
      parent,
      args,
      { db }
    ) => {
      return await storageLocationDataLoader(db)
        .movementsToLoader
        .load(parent.id);
    },
  },

  Query: {
    storageLocations: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where =
          getWhereInStorageLocations(
            args.where || {},
            args.search
          );

        const data =
          await db.storageLocation.findMany({
            where,

            ...(args?.take
              ? { take: args.take }
              : {}),

            ...(args?.skip
              ? { skip: args.skip }
              : {}),

            ...(args?.orderBy
              ? {
                  orderBy: {
                    [args.orderBy.field]:
                      args.orderBy.value,
                  },
                }
              : {}),
          });

        const count =
          await db.storageLocation.count({
            where,
          });

        return {
          data,
          count,
          status,
        };
      } catch (error) {
        status = 500;

        return {
          data: null,
          count: 0,
          status,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error",
        };
      }
    },

    storageLocation: async (
      parent,
      args,
      { db }
    ) => {
      return await db.storageLocation.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createStorageLocation: async (
      parent,
      args,
      { db }
    ) => {
      return await db.storageLocation.create({
        data: {
          ...args.data,
        },
      });
    },

    updateStorageLocation: async (
      parent,
      args,
      { db }
    ) => {
      return await db.storageLocation.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,
        },
      });
    },

    upsertStorageLocation: async (
      parent,
      args,
      { db }
    ) => {
      return await db.storageLocation.upsert({
        where: {
          id: Number(args.where.id),
        },

        create: {
          ...args.data,
        },

        update: {
          ...args.data,
        },
      });
    },

    deleteStorageLocation: async (
      parent,
      args,
      { db }
    ) => {
      return await db.storageLocation.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { storageLocationResolvers };