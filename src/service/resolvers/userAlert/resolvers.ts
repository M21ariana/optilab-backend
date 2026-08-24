import { Resolver } from "../../types";
import { userAlertDataLoader } from "./dataLoaders";
import { getWhereInUserAlerts } from "./transformations";

const userAlertResolvers: Resolver = {
  UserAlert: {
    user: async (
      parent,
      args,
      { db }
    ) => {
      return await userAlertDataLoader(db)
        .userLoader
        .load(parent.userId);
    },

    alert: async (
      parent,
      args,
      { db }
    ) => {
      return await userAlertDataLoader(db)
        .alertLoader
        .load(parent.alertId);
    },
  },

  Query: {
    userAlerts: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInUserAlerts(
          args.where || {},
          args.search
        );

        const data =
          await db.userAlert.findMany({
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
          await db.userAlert.count({
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

    userAlert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.userAlert.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createUserAlert: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.readAt
          ? {
              readAt:
                new Date(args.data.readAt),
            }
          : {}),
      };

      return await db.userAlert.create({
        data,
      });
    },

    updateUserAlert: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.readAt
          ? {
              readAt:
                new Date(args.data.readAt),
            }
          : {}),
      };

      return await db.userAlert.update({
        where: {
          id: Number(args.where.id),
        },

        data,
      });
    },

    upsertUserAlert: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.readAt
          ? {
              readAt:
                new Date(args.data.readAt),
            }
          : {}),
      };

      return await db.userAlert.upsert({
        where: {
          id: Number(args.where.id),
        },

        create: data,
        update: data,
      });
    },

    deleteUserAlert: async (
      parent,
      args,
      { db }
    ) => {
      return await db.userAlert.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { userAlertResolvers };