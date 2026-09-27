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

    sampleCount: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sample.count({
        where: {
          storageLocationId: parent.id,
          status: {
            not: "REMOVED",
          },
        },
      });
    },

    usedAreaCm2: async (
      parent,
      args,
      { db }
    ) => {
      const result =
        await db.sample.aggregate({
          where: {
            storageLocationId: parent.id,
            status: {
              not: "REMOVED",
            },
          },

          _sum: {
            areaCm2: true,
          },
        });

      return Number(
        result._sum.areaCm2 ?? 0
      );
    },
    occupancy: async (
      parent,
      args,
      { db }
    ) => {
      const maxAreaCm2 =
        parent.maxAreaCm2 !== null
          ? Number(parent.maxAreaCm2)
          : null;

      if (
        maxAreaCm2 === null ||
        maxAreaCm2 <= 0
      ) {
        return 0;
      }

      const result =
        await db.sample.aggregate({
          where: {
            storageLocationId: parent.id,
            status: {
              not: "REMOVED",
            },
          },

          _sum: {
            areaCm2: true,
          },
        });

      const usedAreaCm2 = Number(
        result._sum.areaCm2 ?? 0
      );

      return (
        Math.round(
          (usedAreaCm2 / maxAreaCm2) *
          10000
        ) / 100
      );
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
      { db, user }
    ) => {
      let status = 200;

      try {
        // ----------------------------------------
        // AUTH
        // ----------------------------------------

        if (!user) {
          throw new Error(
            "Authentication required."
          );
        }

        if (!user.organizationId) {
          throw new Error(
            "The current user does not belong to an organization."
          );
        }

        // ----------------------------------------
        // USER FILTERS
        // ----------------------------------------

        const requestedWhere =
          getWhereInStorageLocations(
            args.where || {},
            args.search
          );

        // ----------------------------------------
        // ORGANIZATION FILTER
        // ----------------------------------------
        //
        // StorageLocation
        //      ↓
        // Laboratory
        //      ↓
        // Organization
        //
        // A user can only see storage locations
        // belonging to laboratories from their
        // organization.
        // ----------------------------------------

        const where = {
          AND: [
            requestedWhere,

            {
              laboratory: {
                organizationId:
                  user.organizationId,
              },
            },
          ],
        };

        // ----------------------------------------
        // DATA
        // ----------------------------------------

        const data =
          await db.storageLocation.findMany({
            where,

            ...(args?.take
              ? {
                take: args.take,
              }
              : {}),

            ...(args?.skip
              ? {
                skip: args.skip,
              }
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

        // ----------------------------------------
        // COUNT
        // ----------------------------------------

        const count =
          await db.storageLocation.count({
            where,
          });

        return {
          data,
          count,
          status,
          error: null,
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
      { db, user }
    ) => {
      // ----------------------------------------
      // AUTH
      // ----------------------------------------

      if (!user) {
        throw new Error(
          "Authentication required."
        );
      }

      if (!user.organizationId) {
        throw new Error(
          "The current user does not belong to an organization."
        );
      }

      // ----------------------------------------
      // LOCATION
      // ----------------------------------------

      return await db.storageLocation.findFirst({
        where: {
          id: Number(args.id),

          laboratory: {
            organizationId:
              user.organizationId,
          },
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