import { Resolver } from "../../types";
import { userDataLoader } from "./dataLoaders";
import { getWhereInUsers } from "./transformations";

const userResolvers: Resolver = {
  User: {
    organization: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.organizationId) {
        return null;
      }

      return await userDataLoader(db)
        .organizationLoader
        .load(parent.organizationId);
    },

    movements: async (
      parent,
      args,
      { db }
    ) => {
      return await userDataLoader(db)
        .movementsLoader
        .load(parent.id);
    },

    userAlerts: async (
      parent,
      args,
      { db }
    ) => {
      return await userDataLoader(db)
        .userAlertsLoader
        .load(parent.id);
    },
  },

  Query: {
    users: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInUsers(
          args.where || {},
          args.search
        );

        const data =
          await db.user.findMany({
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
          await db.user.count({
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

    user: async (
      parent,
      args,
      { db }
    ) => {
      return await db.user.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createUser: async (
      parent,
      args,
      { db }
    ) => {
      return await db.user.create({
        data: {
          ...args.data,
        },
      });
    },

    updateUser: async (
      parent,
      args,
      { db }
    ) => {
      return await db.user.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,
        },
      });
    },

    upsertUser: async (
      parent,
      args,
      { db }
    ) => {
      return await db.user.upsert({
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

    deleteUser: async (
      parent,
      args,
      { db }
    ) => {
      return await db.user.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { userResolvers };