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
      // TRANSFER
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
      // REQUIRE REASON ONLY FOR TRANSFER
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
          // CREATE MOVEMENT FOR REAL TRANSFER
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
                  "TRANSFER",

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
    // MOVE SAMPLE
    // ====================================================

    moveSample: async (
      parent,
      args,
      { db, user }
    ) => {
      const sampleId = Number(
        args.data.sampleId
      );

      const toLocationId = Number(
        args.data.toLocationId
      );

      const notes = args.data.notes?.trim();

      // ----------------------------------------
      // VALIDATE INPUT
      // ----------------------------------------

      if (
        !Number.isInteger(sampleId) ||
        sampleId <= 0
      ) {
        throw new Error(
          "Invalid sample ID."
        );
      }

      if (
        !Number.isInteger(toLocationId) ||
        toLocationId <= 0
      ) {
        throw new Error(
          "Invalid destination location ID."
        );
      }

      if (!notes) {
        throw new Error(
          "A movement reason is required."
        );
      }

      // ----------------------------------------
      // VALIDATE AUTHENTICATED USER
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
      // GET SAMPLE
      // ----------------------------------------

      const sample =
        await db.sample.findUnique({
          where: {
            id: sampleId,
          },

          include: {
            laboratory: true,
          },
        });

      if (!sample) {
        throw new Error(
          "Sample not found."
        );
      }

      // ----------------------------------------
      // VALIDATE ORGANIZATION ACCESS
      // ----------------------------------------

      if (
        sample.laboratory.organizationId !==
        user.organizationId
      ) {
        throw new Error(
          "Sample not found or access denied."
        );
      }

      // ----------------------------------------
      // VALIDATE SAMPLE STATUS
      // ----------------------------------------

      if (sample.status !== "ACTIVE") {
        throw new Error(
          "Only active samples can be moved."
        );
      }

      // ----------------------------------------
      // VALIDATE CURRENT LOCATION
      // ----------------------------------------

      if (
        sample.storageLocationId === null
      ) {
        throw new Error(
          "The sample does not currently have a storage location."
        );
      }

      if (
        sample.storageLocationId ===
        toLocationId
      ) {
        throw new Error(
          "The sample is already stored in this location."
        );
      }

      // ----------------------------------------
      // GET DESTINATION LOCATION
      // ----------------------------------------

      const destinationLocation =
        await db.storageLocation.findUnique({
          where: {
            id: toLocationId,
          },
        });

      if (!destinationLocation) {
        throw new Error(
          "Destination storage location not found."
        );
      }

      // ----------------------------------------
      // VALIDATE SAME LABORATORY
      // ----------------------------------------

      if (
        destinationLocation.laboratoryId !==
        sample.laboratoryId
      ) {
        throw new Error(
          "The destination location must belong to the same laboratory as the sample."
        );
      }

      // ----------------------------------------
      // TRANSACTION
      // ----------------------------------------

      return await db.$transaction(
        async (tx) => {
          const updatedSample =
            await tx.sample.update({
              where: {
                id: sampleId,
              },

              data: {
                storageLocationId:
                  toLocationId,
              },
            });

          await tx.sampleMovement.create({
            data: {
              sampleId,

              fromLocationId:
                sample.storageLocationId,

              toLocationId,

              movementType:
                "TRANSFER",

              notes,

              performedByUserId:
                user.id,
            },
          });

          return updatedSample;
        }
      );
    },

    // ====================================================
    // REMOVE SAMPLE
    // ====================================================

    removeSample: async (
      parent,
      args,
      { db, user }
    ) => {
      const sampleId = Number(
        args.data.sampleId
      );

      const notes = args.data.notes?.trim();

      // ----------------------------------------
      // VALIDATE INPUT
      // ----------------------------------------

      if (
        !Number.isInteger(sampleId) ||
        sampleId <= 0
      ) {
        throw new Error(
          "Invalid sample ID."
        );
      }

      if (!notes) {
        throw new Error(
          "A removal reason is required."
        );
      }

      // ----------------------------------------
      // VALIDATE AUTHENTICATED USER
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
      // GET SAMPLE
      // ----------------------------------------

      const sample =
        await db.sample.findUnique({
          where: {
            id: sampleId,
          },

          include: {
            laboratory: true,
          },
        });

      if (!sample) {
        throw new Error(
          "Sample not found."
        );
      }

      // ----------------------------------------
      // VALIDATE ORGANIZATION ACCESS
      // ----------------------------------------

      if (
        sample.laboratory.organizationId !==
        user.organizationId
      ) {
        throw new Error(
          "Sample not found or access denied."
        );
      }

      // ----------------------------------------
      // VALIDATE SAMPLE STATUS
      // ----------------------------------------

      if (sample.status !== "ACTIVE") {
        throw new Error(
          "Only active samples can be removed."
        );
      }

      // ----------------------------------------
      // VALIDATE CURRENT LOCATION
      // ----------------------------------------

      if (
        sample.storageLocationId === null
      ) {
        throw new Error(
          "The sample does not currently have a storage location."
        );
      }

      const fromLocationId =
        sample.storageLocationId;

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
                storageLocationId: null,
                status: "REMOVED",
              },
            });

          // ------------------------------------
          // CREATE EXIT MOVEMENT
          // ------------------------------------

          await tx.sampleMovement.create({
            data: {
              sampleId,

              fromLocationId,

              toLocationId: null,

              movementType: "EXIT",

              notes,

              performedByUserId:
                user.id,
            },
          });

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