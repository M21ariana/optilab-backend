import { Resolver } from "../../types";
import { sampleDataLoader } from "./dataLoaders";
import { getWhereInSamples } from "./transformations";
import { recommendStorageLocationsForSample } from "../../storageRecommendation/service";

const sampleResolvers: Resolver = {
  // ======================================================
  // RELATIONSHIPS
  // ======================================================

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

  // ======================================================
  // QUERIES
  // ======================================================

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

        const data =
          await db.sample.findMany({
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
          await db.sample.count({
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

    recommendedStorageLocations:
      async (
        parent,
        args,
        { db }
      ) => {
        return await recommendStorageLocationsForSample(
          db,
          Number(args.sampleId)
        );
      },
  },

  // ======================================================
  // MUTATIONS
  // ======================================================

  Mutation: {
    // ====================================================
    // CREATE SAMPLE
    // ====================================================

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
                entryDate: new Date(
                  args.data.entryDate
                ),
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

    // ====================================================
    // UPDATE SAMPLE
    // ====================================================

    updateSample: async (
      parent,
      args,
      { db, user }
    ) => {
      const sampleId = Number(
        args.where.id
      );

      // ----------------------------------------
      // VALIDATE SAMPLE ID
      // ----------------------------------------

      if (
        !Number.isInteger(sampleId) ||
        sampleId <= 0
      ) {
        throw new Error(
          "Invalid sample ID."
        );
      }

      // ----------------------------------------
      // GET CURRENT SAMPLE
      // ----------------------------------------

      const currentSample =
        await db.sample.findUnique({
          where: {
            id: sampleId,
          },
        });

      if (!currentSample) {
        throw new Error(
          "Sample not found."
        );
      }

      // ----------------------------------------
      // SEPARATE AUXILIARY DATA
      // ----------------------------------------

      const {
        movementReason,
        ...sampleData
      } = args.data;

      // ----------------------------------------
      // LOCATION STATE
      // ----------------------------------------

      const hasLocationUpdate =
        sampleData.storageLocationId !==
        undefined;

      const newLocationId =
        hasLocationUpdate
          ? sampleData.storageLocationId
          : currentSample.storageLocationId;

      // ----------------------------------------
      // INITIAL LOCATION ASSIGNMENT
      //
      // null -> location
      //
      // The sample has just been created and
      // receives its first storage location.
      // This is NOT a relocation.
      // ----------------------------------------

      const isInitialLocationAssignment =
        hasLocationUpdate &&
        currentSample.storageLocationId ===
          null &&
        newLocationId !== null &&
        newLocationId !== undefined;

      // ----------------------------------------
      // RELOCATION
      //
      // existing location -> different location
      // ----------------------------------------

      const isRelocation =
        hasLocationUpdate &&
        currentSample.storageLocationId !==
          null &&
        newLocationId !== null &&
        newLocationId !== undefined &&
        newLocationId !==
          currentSample.storageLocationId;

      // ----------------------------------------
      // REQUIRE REASON ONLY FOR RELOCATION
      // ----------------------------------------

      if (
        isRelocation &&
        !movementReason?.trim()
      ) {
        throw new Error(
          "A movement reason is required when changing the sample location."
        );
      }

      // ----------------------------------------
      // TRANSACTION
      // ----------------------------------------

      return await db.$transaction(
        async (tx) => {
          // ------------------------------------
          // UPDATE SAMPLE
          // ------------------------------------

          const updatedSample =
            await tx.sample.update({
              where: {
                id: sampleId,
              },

              data: {
                ...sampleData,

                ...(sampleData.entryDate
                  ? {
                      entryDate:
                        new Date(
                          sampleData.entryDate
                        ),
                    }
                  : {}),

                ...(sampleData.expirationDate
                  ? {
                      expirationDate:
                        new Date(
                          sampleData.expirationDate
                        ),
                    }
                  : {}),
              },
            });

          // ------------------------------------
          // INITIAL LOCATION ASSIGNMENT
          // ------------------------------------
          //
          // No SampleMovement is created here.
          //
          // The sample did not move from one
          // storage location to another; it is
          // simply receiving its first location.
          // ------------------------------------

          if (
            isInitialLocationAssignment
          ) {
            return updatedSample;
          }

          // ------------------------------------
          // CREATE MOVEMENT FOR REAL RELOCATION
          // ------------------------------------

          if (isRelocation) {
            await tx.sampleMovement.create({
              data: {
                sampleId,

                fromLocationId:
                  currentSample.storageLocationId,

                toLocationId:
                  newLocationId,

                movementType:
                  "RELOCATION",

                notes:
                  movementReason.trim(),

                performedByUserId:
                  user?.id ?? null,
              },
            });
          }

          return updatedSample;
        }
      );
    },

    // ====================================================
    // UPSERT SAMPLE
    // ====================================================

    upsertSample: async (
      parent,
      args,
      { db }
    ) => {
      const data = {
        ...args.data,

        ...(args.data.entryDate
          ? {
              entryDate: new Date(
                args.data.entryDate
              ),
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

    // ====================================================
    // DELETE SAMPLE
    // ====================================================

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