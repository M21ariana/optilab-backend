import { Resolver } from "../../types";
import { organizationDataLoader } from "./dataLoaders";
import { getWhereInOrganizations } from "./transformations";

const organizationResolvers: Resolver = {
  Organization: {
    laboratories: async (parent, args, { db }) => {
      return await organizationDataLoader(db)
        .laboratoriesLoader
        .load(parent.id);
    },

    users: async (parent, args, { db }) => {
      return await organizationDataLoader(db)
        .usersLoader
        .load(parent.id);
    },
  },

  Query: {
    organizations: async (parent, args, { db }) => {
      let status = 200;

      try {
        const where = getWhereInOrganizations(
          args.where || {},
          args.search
        );

        const data = await db.organization.findMany({
          where,
          ...(args?.take ? { take: args.take } : {}),
          ...(args?.skip ? { skip: args.skip } : {}),
          ...(args?.orderBy
            ? {
                orderBy: {
                  [args.orderBy.field]: args.orderBy.value,
                },
              }
            : {}),
        });

        const count = await db.organization.count({
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

    organization: async (parent, args, { db }) => {
      return await db.organization.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createOrganization: async (parent, args, { db }) => {
      return await db.organization.create({
        data: {
          ...args.data,
        },
      });
    },

    updateOrganization: async (parent, args, { db }) => {
      return await db.organization.update({
        where: {
          id: Number(args.where.id),
        },
        data: {
          ...args.data,
        },
      });
    },

    upsertOrganization: async (parent, args, { db }) => {
      return await db.organization.upsert({
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

    deleteOrganization: async (parent, args, { db }) => {
      return await db.organization.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { organizationResolvers };