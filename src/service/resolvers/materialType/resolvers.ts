import { Resolver } from "../../types";
import { materialTypeDataLoader } from "./dataLoaders";
import { getWhereInMaterialTypes } from "./transformations";

const materialTypeResolvers: Resolver = {
  MaterialType: {
    samples: async (
      parent,
      args,
      { db }
    ) => {
      return await materialTypeDataLoader(db)
        .samplesLoader
        .load(parent.id);
    },
  },

  Query: {
    materialTypes: async (
      parent,
      args,
      { db }
    ) => {
      let status = 200;

      try {
        const where = getWhereInMaterialTypes(
          args.where || {},
          args.search
        );

        const data =
          await db.materialType.findMany({
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
          await db.materialType.count({
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

    materialType: async (
      parent,
      args,
      { db }
    ) => {
      return await db.materialType.findUnique({
        where: {
          id: Number(args.id),
        },
      });
    },
  },

  Mutation: {
    createMaterialType: async (
      parent,
      args,
      { db }
    ) => {
      return await db.materialType.create({
        data: {
          ...args.data,
        },
      });
    },

    updateMaterialType: async (
      parent,
      args,
      { db }
    ) => {
      return await db.materialType.update({
        where: {
          id: Number(args.where.id),
        },

        data: {
          ...args.data,
        },
      });
    },

    upsertMaterialType: async (
      parent,
      args,
      { db }
    ) => {
      return await db.materialType.upsert({
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

    deleteMaterialType: async (
      parent,
      args,
      { db }
    ) => {
      return await db.materialType.delete({
        where: {
          id: Number(args.where.id),
        },
      });
    },
  },
};

export { materialTypeResolvers };