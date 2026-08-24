import { Resolver } from "../../types";
import { alertDataLoader } from "./dataLoaders";
import { getWhereInAlerts } from "./transformations";

const alertResolvers: Resolver = {
  Alert: {
    laboratory: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.laboratoryId) {
        return null;
      }

      return await alertDataLoader(db)
        .laboratoryLoader
        .load(parent.laboratoryId);
    },

    storageLocation: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.storageLocationId) {
        return null;
      }

      return await alertDataLoader(db)
        .storageLocationLoader
        .load(parent.storageLocationId);
    },

    sample: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.sampleId) {
        return null;
      }

      return await alertDataLoader(db)
        .sampleLoader
        .load(parent.sampleId);
    },

    userAlerts: async (
      parent,
      args,
      { db }
    ) => {
      return await alertDataLoader(db)
        .userAlertsLoader
        .load(parent.id);
    },
  },

  Query: {
    alerts: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInAlerts(
          args.where || {},
          args.search
        );

        const data = await db.alert.findMany({
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

        const count = await db.alert.count({
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

    alert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.alert.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createAlert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.alert.create({
        data: {
          ...args.data,

          ...(args.data.resolvedAt
            ? {
                resolvedAt:
                  new Date(args.data.resolvedAt),
              }
            : {}),
        },
      });
    },

    updateAlert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.alert.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,

          ...(args.data.resolvedAt
            ? {
                resolvedAt:
                  new Date(args.data.resolvedAt),
              }
            : {}),
        },
      });
    },

    upsertAlert: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.resolvedAt
          ? {
              resolvedAt:
                new Date(args.data.resolvedAt),
            }
          : {}),
      };

      return await db.alert.upsert({
        where: {
          id: Number(args.where.id),
        },

        create: data,
        update: data,
      });
    },

    deleteAlert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.alert.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { alertResolvers };