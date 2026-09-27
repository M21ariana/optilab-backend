import { Resolver } from "../../types";
import { sampleMovementDataLoader } from "./dataLoaders";
import { getWhereInSampleMovements } from "./transformations";

const sampleMovementResolvers: Resolver = {
  SampleMovement: {
    sample: async (
      parent,
      args,
      { db }
    ) => {
      return await sampleMovementDataLoader(db)
        .sampleLoader
        .load(parent.sampleId);
    },

    fromLocation: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.fromLocationId) {
        return null;
      }

      return await sampleMovementDataLoader(db)
        .fromLocationLoader
        .load(parent.fromLocationId);
    },

    toLocation: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.toLocationId) {
        return null;
      }

      return await sampleMovementDataLoader(db)
        .toLocationLoader
        .load(parent.toLocationId);
    },

    performedBy: async (
      parent,
      args,
      { db }
    ) => {
      if (!parent.performedByUserId) {
        return null;
      }

      return await sampleMovementDataLoader(db)
        .userLoader
        .load(parent.performedByUserId);
    },
  },

  Query: {
    sampleMovements: async (
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
          getWhereInSampleMovements(
            args.where || {},
            args.search
          );

        // ----------------------------------------
        // ORGANIZATION FILTER
        // ----------------------------------------
        //
        // Every movement must belong to a sample
        // whose laboratory belongs to the current
        // user's organization.
        //
        // SampleMovement
        //      ↓
        // Sample
        //      ↓
        // Laboratory
        //      ↓
        // Organization
        // ----------------------------------------

        const where = {
          AND: [
            requestedWhere,

            {
              sample: {
                laboratory: {
                  organizationId:
                    user.organizationId,
                },
              },
            },
          ],
        };

        // ----------------------------------------
        // DATA
        // ----------------------------------------

        const data =
          await db.sampleMovement.findMany({
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
          await db.sampleMovement.count({
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

    ssampleMovement: async (
      parent,
      args,
      { db, user }
    ) => {
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

      return await db.sampleMovement.findFirst({
        where: {
          id: Number(args.id),

          sample: {
            laboratory: {
              organizationId:
                user.organizationId,
            },
          },
        },
      });
    },
  },

  Mutation: {
    createSampleMovement: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sampleMovement.create({
        data: {
          ...args.data,
        },
      });
    },

    updateSampleMovement: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sampleMovement.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,
        },
      });
    },

    upsertSampleMovement: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sampleMovement.upsert({
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

    deleteSampleMovement: async (
      parent,
      args,
      { db }
    ) => {
      return await db.sampleMovement.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { sampleMovementResolvers };