import { Resolver } from "../../types";
import { sampleDataLoader } from "./dataLoaders";
import { getWhereInSamples } from "./transformations";
import { recommendStorageLocationsForSample } from "../../storageRecommendation/service";
import {
  syncSampleAlerts,
  syncHighOccupancyAlert,
} from "../../alertManagement/service";

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
          getWhereInSamples(
            args.where || {},
            args.search
          );

        // ----------------------------------------
        // ORGANIZATION FILTER
        // ----------------------------------------
        //
        // Sample
        //    ↓
        // Laboratory
        //    ↓
        // Organization
        // ----------------------------------------

        const where = {
          AND: [
            requestedWhere,

            {
              laboratory: {
                organizationId:
                  user.organizationId,
              },
            },
          ],
        };

        // ----------------------------------------
        // DATA
        // ----------------------------------------

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

        // ----------------------------------------
        // COUNT
        // ----------------------------------------

        const count =
          await db.sample.count({
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

    sample: async (
      parent,
      args,
      { db, user }
    ) => {
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
      // VALIDATE ID
      // ----------------------------------------

      const sampleId = Number(args.id);

      if (
        !Number.isInteger(sampleId) ||
        sampleId <= 0
      ) {
        throw new Error(
          "Invalid sample ID."
        );
      }

      // ----------------------------------------
      // GET SAMPLE
      // ----------------------------------------
      //
      // Sample
      //    ↓
      // Laboratory
      //    ↓
      // Organization
      // ----------------------------------------

      return await db.sample.findFirst({
        where: {
          id: sampleId,

          laboratory: {
            organizationId:
              user.organizationId,
          },
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

    // ====================================================
    // CREATE SAMPLE
    // ====================================================

    createSample: async (
      parent,
      args,
      { db, user }
    ) => {
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

      const laboratoryId = Number(
        args.data.laboratoryId
      );

      const storageLocationId =
        args.data.storageLocationId !==
          undefined &&
          args.data.storageLocationId !== null
          ? Number(
            args.data.storageLocationId
          )
          : null;

      // ----------------------------------------
      // VALIDATE LABORATORY
      // ----------------------------------------

      const laboratory =
        await db.laboratory.findUnique({
          where: {
            id: laboratoryId,
          },
        });

      if (!laboratory) {
        throw new Error(
          "Laboratory not found."
        );
      }

      // ----------------------------------------
      // VALIDATE ORGANIZATION ACCESS
      // ----------------------------------------

      if (
        laboratory.organizationId !==
        user.organizationId
      ) {
        throw new Error(
          "Laboratory not found or access denied."
        );
      }

      // ----------------------------------------
      // VALIDATE INITIAL LOCATION
      // ----------------------------------------

      if (storageLocationId !== null) {
        const storageLocation =
          await db.storageLocation.findUnique({
            where: {
              id: storageLocationId,
            },
          });

        if (!storageLocation) {
          throw new Error(
            "Storage location not found."
          );
        }

        if (
          storageLocation.laboratoryId !==
          laboratoryId
        ) {
          throw new Error(
            "The storage location must belong to the selected laboratory."
          );
        }
      }

      // ----------------------------------------
      // CREATE SAMPLE + OPTIONAL ENTRY
      // ----------------------------------------

      return await db.$transaction(
        async (tx) => {
          const sample =
            await tx.sample.create({
              data: {
                ...args.data,

                storageLocationId,

                entryDate:
                  args.data.entryDate
                    ? new Date(
                      args.data.entryDate
                    )
                    : new Date(),

                ...(args.data.expirationDate
                  ? {
                    expirationDate:
                      new Date(
                        args.data
                          .expirationDate
                      ),
                  }
                  : {}),
              },
            });

          // --------------------------------------
          // REGISTER INITIAL ENTRY
          // --------------------------------------

          if (storageLocationId !== null) {
            await tx.sampleMovement.create({
              data: {
                sampleId: sample.id,

                fromLocationId: null,

                toLocationId:
                  storageLocationId,

                movementType: "ENTRY",

                notes:
                  "Sample assigned to storage location.",

                performedByUserId:
                  user.id,
              },
            });
          }

          // --------------------------------------
          // SYNC SAMPLE ALERTS
          // --------------------------------------

          await syncSampleAlerts(
            tx,
            sample.id
          );

          // --------------------------------------
          // SYNC LOCATION OCCUPANCY ALERT
          // --------------------------------------

          if (storageLocationId !== null) {
            await syncHighOccupancyAlert(
              tx,
              storageLocationId
            );
          }

          return sample;
        }
      );
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

          include: {
            laboratory: true,
          },
        });

      if (!currentSample) {
        throw new Error(
          "Sample not found."
        );
      }

      // ----------------------------------------
      // DETECT LOCATION CHANGE
      // ----------------------------------------

      const hasLocationUpdate =
        args.data.storageLocationId !==
        undefined;

      const newLocationId =
        args.data.storageLocationId;

      const isEntry =
        hasLocationUpdate &&
        currentSample.storageLocationId ===
        null &&
        newLocationId !== null;

      const isTransfer =
        hasLocationUpdate &&
        currentSample.storageLocationId !==
        null &&
        newLocationId !== null &&
        currentSample.storageLocationId !==
        newLocationId;

      const isExit =
        hasLocationUpdate &&
        currentSample.storageLocationId !==
        null &&
        newLocationId === null;

      // ----------------------------------------
      // BLOCK TRANSFER THROUGH UPDATE
      // ----------------------------------------

      if (isTransfer) {
        throw new Error(
          "Use moveSample to change the sample storage location."
        );
      }

      // ----------------------------------------
      // BLOCK EXIT THROUGH UPDATE
      // ----------------------------------------

      if (isExit) {
        throw new Error(
          "Use removeSample to remove the sample from storage."
        );
      }

      // ----------------------------------------
      // NORMAL UPDATE
      // ----------------------------------------

      if (!isEntry) {
        return await db.$transaction(
          async (tx) => {
            const updatedSample =
              await tx.sample.update({
                where: {
                  id: sampleId,
                },

                data: {
                  ...args.data,

                  ...(args.data.entryDate
                    ? {
                      entryDate:
                        new Date(
                          args.data
                            .entryDate
                        ),
                    }
                    : {}),

                  ...(args.data.expirationDate
                    ? {
                      expirationDate:
                        new Date(
                          args.data
                            .expirationDate
                        ),
                    }
                    : {}),
                },
              });

            // --------------------------------------
            // RE-EVALUATE SAMPLE ALERTS
            // --------------------------------------

            await syncSampleAlerts(
              tx,
              sampleId
            );

            // --------------------------------------
            // RE-EVALUATE CURRENT LOCATION
            // --------------------------------------

            if (
              updatedSample.storageLocationId !==
              null
            ) {
              await syncHighOccupancyAlert(
                tx,
                updatedSample.storageLocationId
              );
            }

            return updatedSample;
          }
        );
      }

      // ----------------------------------------
      // ENTRY REQUIRES AUTHENTICATED USER
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
      // VALIDATE ORGANIZATION ACCESS
      // ----------------------------------------

      if (
        currentSample.laboratory
          .organizationId !==
        user.organizationId
      ) {
        throw new Error(
          "Sample not found or access denied."
        );
      }

      // ----------------------------------------
      // VALIDATE DESTINATION LOCATION
      // ----------------------------------------

      const destinationLocation =
        await db.storageLocation.findUnique({
          where: {
            id: Number(newLocationId),
          },
        });

      if (!destinationLocation) {
        throw new Error(
          "Destination storage location not found."
        );
      }

      // ----------------------------------------
      // LOCATION MUST BELONG TO SAME LAB
      // ----------------------------------------

      if (
        destinationLocation.laboratoryId !==
        currentSample.laboratoryId
      ) {
        throw new Error(
          "The destination location must belong to the same laboratory as the sample."
        );
      }

      // ----------------------------------------
      // UPDATE SAMPLE + CREATE ENTRY
      // ----------------------------------------

      return await db.$transaction(
        async (tx) => {
          const updatedSample =
            await tx.sample.update({
              where: {
                id: sampleId,
              },

              data: {
                ...args.data,

                ...(args.data.entryDate
                  ? {
                    entryDate:
                      new Date(
                        args.data
                          .entryDate
                      ),
                  }
                  : {}),

                ...(args.data.expirationDate
                  ? {
                    expirationDate:
                      new Date(
                        args.data
                          .expirationDate
                      ),
                  }
                  : {}),
              },
            });

          // --------------------------------------
          // REGISTER ENTRY
          // --------------------------------------

          await tx.sampleMovement.create({
            data: {
              sampleId,

              fromLocationId: null,

              toLocationId: Number(
                newLocationId
              ),

              movementType: "ENTRY",

              notes:
                "Sample assigned to storage location.",

              performedByUserId:
                user.id,
            },
          });

          // --------------------------------------
          // RE-EVALUATE SAMPLE ALERTS
          // --------------------------------------

          await syncSampleAlerts(
            tx,
            sampleId
          );

          // --------------------------------------
          // RE-EVALUATE DESTINATION OCCUPANCY
          // --------------------------------------

          await syncHighOccupancyAlert(
            tx,
            Number(newLocationId)
          );

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

      // Save the origin before updating the sample.
      const fromLocationId =
        sample.storageLocationId;

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
          // --------------------------------------
          // UPDATE SAMPLE LOCATION
          // --------------------------------------

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

          // --------------------------------------
          // REGISTER MOVEMENT
          // --------------------------------------

          await tx.sampleMovement.create({
            data: {
              sampleId,

              fromLocationId,

              toLocationId,

              movementType:
                "TRANSFER",

              notes,

              performedByUserId:
                user.id,
            },
          });

          // --------------------------------------
          // RE-EVALUATE SAMPLE ALERTS
          // --------------------------------------
          // Important because the destination may
          // have different storage capabilities.

          await syncSampleAlerts(
            tx,
            sampleId
          );

          // --------------------------------------
          // RE-EVALUATE ORIGIN OCCUPANCY
          // --------------------------------------
          // The sample left this location, so its
          // occupied area decreased.

          await syncHighOccupancyAlert(
            tx,
            fromLocationId
          );

          // --------------------------------------
          // RE-EVALUATE DESTINATION OCCUPANCY
          // --------------------------------------
          // The sample entered this location, so
          // its occupied area increased.

          await syncHighOccupancyAlert(
            tx,
            toLocationId
          );

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

          // ------------------------------------
          // RE-EVALUATE SAMPLE ALERTS
          // ------------------------------------
          // Since the sample is now REMOVED,
          // its active sample alerts should be
          // resolved.

          await syncSampleAlerts(
            tx,
            sampleId
          );

          // ------------------------------------
          // RE-EVALUATE LOCATION OCCUPANCY
          // ------------------------------------
          // The sample has left the location,
          // therefore its occupied area has
          // decreased.

          await syncHighOccupancyAlert(
            tx,
            fromLocationId
          );

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
      { db, user }
    ) => {
      const sampleId = Number(
        args.where.id
      );

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
      // SAVE CURRENT LOCATION
      // ----------------------------------------

      const storageLocationId =
        sample.storageLocationId;

      // ----------------------------------------
      // DELETE SAMPLE
      // ----------------------------------------

      return await db.$transaction(
        async (tx) => {
          const deletedSample =
            await tx.sample.delete({
              where: {
                id: sampleId,
              },
            });

          // ------------------------------------
          // RE-EVALUATE LOCATION OCCUPANCY
          // ------------------------------------
          // Only necessary if the sample was
          // currently assigned to a location.

          if (storageLocationId !== null) {
            await syncHighOccupancyAlert(
              tx,
              storageLocationId
            );
          }

          return deletedSample;
        }
      );
    },
  },
};

export { sampleResolvers };