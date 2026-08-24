import { Resolver } from "../../types";
import { sampleDataLoader } from "./dataLoaders";
import { getWhereInSamples } from "./transformations";

const sampleResolvers: Resolver = {
  Sample: {
    laboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await sampleDataLoader(db)
        .laboratoryLoader
        .load(parent.laboratoryId);
    },

    materialType: async (
      parent,
      args,
      { db }
    ) => {
      return await sampleDataLoader(db)
        .materialTypeLoader
        .load(parent.materialTypeId);
    },

    storageLocation: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.storageLocationId) {
        return null;
      }

      return await sampleDataLoader(db)
        .storageLocationLoader
        .load(parent.storageLocationId);
    },

    movements: async (
      parent,
      args,
      { db }
    ) => {
      return await sampleDataLoader(db)
        .movementsLoader
        .load(parent.id);
    },

    alerts: async (
      parent,
      args,
      { db }
    ) => {
      return await sampleDataLoader(db)
        .alertsLoader
        .load(parent.id);
    },
  },

  Query: {
    samples: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInSamples(
          args.where || {},
          args.search
        );

        const data = await db.sample.findMany({
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

        const count = await db.sample.count({
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

    sample: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sample.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createSample: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sample.create({
        data: {
          ...args.data,

          ...(args.data.entryDate
            ? {
                entryDate:
                  new Date(args.data.entryDate),
              }
            : {}),

          ...(args.data.expirationDate
            ? {
                expirationDate:
                  new Date(
                    args.data.expirationDate
                  ),
              }
            : {}),
        },
      });
    },

    updateSample: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sample.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,

          ...(args.data.entryDate
            ? {
                entryDate:
                  new Date(args.data.entryDate),
              }
            : {}),

          ...(args.data.expirationDate
            ? {
                expirationDate:
                  new Date(
                    args.data.expirationDate
                  ),
              }
            : {}),
        },
      });
    },

    upsertSample: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.entryDate
          ? {
              entryDate:
                new Date(args.data.entryDate),
            }
          : {}),

        ...(args.data.expirationDate
          ? {
              expirationDate:
                new Date(
                  args.data.expirationDate
                ),
            }
          : {}),
      };

      return await db.sample.upsert({
        where: {
          id: Number(args.where.id),
        },

        create: data,

        update: data,
      });
    },

    deleteSample: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sample.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { sampleResolvers };