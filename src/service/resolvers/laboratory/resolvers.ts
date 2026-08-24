import { Resolver } from "../../types";
import { laboratoryDataLoader } from "./dataLoaders";
import { getWhereInLaboratories } from "./transformations";

const laboratoryResolvers: Resolver = {
  // ======================================================
  // RELATIONSHIPS
  // ======================================================

  Laboratory: {
    organization: async (
      parent,
      args,
      { db }
    ) => {
      return await laboratoryDataLoader(db)
        .organizationLoader
        .load(parent.organizationId);
    },

    storageLocations: async (
      parent,
      args,
      { db }
    ) => {
      return await laboratoryDataLoader(db)
        .storageLocationsLoader
        .load(parent.id);
    },

    samples: async (
      parent,
      args,
      { db }
    ) => {
      return await laboratoryDataLoader(db)
        .samplesLoader
        .load(parent.id);
    },

    alerts: async (
      parent,
      args,
      { db }
    ) => {
      return await laboratoryDataLoader(db)
        .alertsLoader
        .load(parent.id);
    },
  },


  // ======================================================
  // QUERIES
  // ======================================================

  Query: {
    laboratories: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInLaboratories(
          args.where || {},
          args.search
        );

        const data =
          await db.laboratory.findMany({
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

        const count =
          await db.laboratory.count({
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

    laboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await db.laboratory.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },


  // ======================================================
  // MUTATIONS
  // ======================================================

  Mutation: {
    createLaboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await db.laboratory.create({
        data: {
          ...args.data,
        },
      });
    },

    updateLaboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await db.laboratory.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,
        },
      });
    },

    upsertLaboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await db.laboratory.upsert({
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

    deleteLaboratory: async (
      parent,
      args,
      { db }
    ) => {
      return await db.laboratory.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { laboratoryResolvers };