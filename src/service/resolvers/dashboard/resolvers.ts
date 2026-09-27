import { Resolver } from "../../types";

const dashboardResolvers: Resolver = {
  Query: {
    dashboard: async (
      parent,
      args,
      {
        db,
        user,
      }
    ) => {
      // ==================================================
      // ORGANIZATION
      // ==================================================

      const organizationId =
        user?.organizationId;

      if (!organizationId) {
        throw new Error(
          "The current user does not belong to an organization."
        );
      }

      // ==================================================
      // SCOPE
      // ==================================================

      const requestedLaboratoryId =
        args.laboratoryId !== undefined &&
        args.laboratoryId !== null
          ? Number(args.laboratoryId)
          : null;

      if (
        requestedLaboratoryId !== null &&
        (
          !Number.isInteger(
            requestedLaboratoryId
          ) ||
          requestedLaboratoryId <= 0
        )
      ) {
        throw new Error(
          "Invalid laboratory ID."
        );
      }

      let laboratoryId: number | null =
        null;

      if (requestedLaboratoryId !== null) {
        const laboratory =
          await db.laboratory.findFirst({
            where: {
              id: requestedLaboratoryId,
              organizationId,
            },

            select: {
              id: true,
            },
          });

        if (!laboratory) {
          throw new Error(
            "Laboratory not found or access denied."
          );
        }

        laboratoryId = laboratory.id;
      }

      const scope =
        laboratoryId === null
          ? "ORGANIZATION"
          : "LABORATORY";

      // ==================================================
      // REUSABLE FILTERS
      // ==================================================

      const sampleScopeWhere =
        laboratoryId !== null
          ? {
              laboratoryId,
            }
          : {
              laboratory: {
                organizationId,
              },
            };

      const locationScopeWhere =
        laboratoryId !== null
          ? {
              laboratoryId,
            }
          : {
              laboratory: {
                organizationId,
              },
            };

      const alertScopeWhere =
        laboratoryId !== null
          ? {
              laboratoryId,
            }
          : {
              laboratory: {
                organizationId,
              },
            };

      // ==================================================
      // DATES
      // ==================================================

      const now = new Date();

      const startOfToday =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const startOfTomorrow =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );

      const startOfMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      // ==================================================
      // BASE METRICS
      // ==================================================

      const [
        activeSamples,
        samplesCreatedThisMonth,
        storageLocations,
        occupiedSamples,
        pendingAlerts,
        criticalAlerts,
        movementsToday,
        laboratoryCount,
        materialTypes,
      ] = await Promise.all([
        // ----------------------------------------------
        // ACTIVE SAMPLES
        // ----------------------------------------------

        db.sample.count({
          where: {
            ...sampleScopeWhere,
            status: "ACTIVE",
          },
        }),

        // ----------------------------------------------
        // SAMPLES CREATED THIS MONTH
        // ----------------------------------------------

        db.sample.count({
          where: {
            ...sampleScopeWhere,

            createdAt: {
              gte: startOfMonth,
            },
          },
        }),

        // ----------------------------------------------
        // STORAGE CAPACITY
        // ----------------------------------------------

        db.storageLocation.findMany({
          where: locationScopeWhere,

          select: {
            maxAreaCm2: true,
          },
        }),

        // ----------------------------------------------
        // AREA CURRENTLY OCCUPIED
        // ----------------------------------------------

        db.sample.findMany({
          where: {
            ...sampleScopeWhere,

            status: "ACTIVE",

            storageLocationId: {
              not: null,
            },
          },

          select: {
            areaCm2: true,
          },
        }),

        // ----------------------------------------------
        // PENDING ALERTS
        // ----------------------------------------------

        db.alert.count({
          where: {
            ...alertScopeWhere,

            isResolved: false,
          },
        }),

        // ----------------------------------------------
        // CRITICAL ALERTS
        // ----------------------------------------------

        db.alert.count({
          where: {
            ...alertScopeWhere,

            isResolved: false,

            severity: "CRITICAL",
          },
        }),

        // ----------------------------------------------
        // MOVEMENTS TODAY
        // ----------------------------------------------

        db.sampleMovement.count({
          where: {
            sample: sampleScopeWhere,

            createdAt: {
              gte: startOfToday,
              lt: startOfTomorrow,
            },
          },
        }),

        // ----------------------------------------------
        // LABORATORIES
        // ----------------------------------------------

        laboratoryId !== null
          ? Promise.resolve(1)
          : db.laboratory.count({
              where: {
                organizationId,
              },
            }),

        // ----------------------------------------------
        // MATERIAL TYPES IN USE
        // ----------------------------------------------

        db.sample.findMany({
          where: sampleScopeWhere,

          select: {
            materialTypeId: true,
          },

          distinct: [
            "materialTypeId",
          ],
        }),
      ]);

      // ==================================================
      // AREA CALCULATIONS
      // ==================================================

      const totalAreaCm2 =
        storageLocations.reduce(
          (
            total,
            location
          ) =>
            total +
            Number(
              location.maxAreaCm2 ?? 0
            ),
          0
        );

      const usedAreaCm2 =
        occupiedSamples.reduce(
          (
            total,
            sample
          ) =>
            total +
            Number(sample.areaCm2 ?? 0),
          0
        );

      const availableAreaCm2 =
        Math.max(
          totalAreaCm2 -
            usedAreaCm2,
          0
        );

      const areaUsagePercentage =
        totalAreaCm2 > 0
          ? Math.min(
              (
                usedAreaCm2 /
                totalAreaCm2
              ) * 100,
              100
            )
          : 0;

      // ==================================================
      // RECENT ACTIVITY
      // ==================================================

      const [
        recentSamples,
        recentMovements,
        recentAlerts,
      ] = await Promise.all([
        // ----------------------------------------------
        // RECENT SAMPLES
        // ----------------------------------------------

        db.sample.findMany({
          where: sampleScopeWhere,

          orderBy: {
            createdAt: "desc",
          },

          take: 5,

          select: {
            id: true,
            code: true,
            name: true,
            createdAt: true,
          },
        }),

        // ----------------------------------------------
        // RECENT MOVEMENTS
        // ----------------------------------------------

        db.sampleMovement.findMany({
          where: {
            sample: sampleScopeWhere,
          },

          orderBy: {
            createdAt: "desc",
          },

          take: 5,

          select: {
            id: true,
            movementType: true,
            createdAt: true,

            sample: {
              select: {
                code: true,
                name: true,
              },
            },

            fromLocation: {
              select: {
                code: true,
              },
            },

            toLocation: {
              select: {
                code: true,
              },
            },
          },
        }),

        // ----------------------------------------------
        // RECENT ALERTS
        // ----------------------------------------------

        db.alert.findMany({
          where: alertScopeWhere,

          orderBy: {
            createdAt: "desc",
          },

          take: 5,

          select: {
            id: true,
            message: true,
            severity: true,
            createdAt: true,
          },
        }),
      ]);

      // ==================================================
      // NORMALIZE ACTIVITY
      // ==================================================

      const sampleActivity =
        recentSamples.map(
          (sample) => ({
            id: `sample-${sample.id}`,

            type: "SAMPLE",

            title:
              `Muestra ${sample.code} registrada`,

            description:
              sample.name,

            createdAt:
              sample.createdAt ??
              new Date(0),
          })
        );

      const movementActivity =
        recentMovements.map(
          (movement) => ({
            id: `movement-${movement.id}`,

            type: "MOVEMENT",

            title:
              `Muestra ${movement.sample.code} trasladada`,

            description:
              movement.fromLocation &&
              movement.toLocation
                ? `Movida de ${movement.fromLocation.code} a ${movement.toLocation.code}.`
                : movement.toLocation
                  ? `Asignada a ${movement.toLocation.code}.`
                  : `Movimiento ${movement.movementType}.`,

            createdAt:
              movement.createdAt,
          })
        );

      const alertActivity =
        recentAlerts.map(
          (alert) => ({
            id: `alert-${alert.id}`,

            type: "ALERT",

            title:
              `Alerta ${alert.severity.toLowerCase()}`,

            description:
              alert.message,

            createdAt:
              alert.createdAt ??
              new Date(0),
          })
        );

      const recentActivity = [
        ...sampleActivity,
        ...movementActivity,
        ...alertActivity,
      ]
        .sort(
          (a, b) =>
            b.createdAt.getTime() -
            a.createdAt.getTime()
        )
        .slice(0, 5);

      // ==================================================
      // RESPONSE
      // ==================================================

      return {
        scope,
        laboratoryId,

        activeSamples,
        samplesCreatedThisMonth,

        totalAreaCm2,
        usedAreaCm2,
        availableAreaCm2,
        areaUsagePercentage,

        pendingAlerts,
        criticalAlerts,

        movementsToday,

        laboratoryCount,

        materialTypeCount:
          materialTypes.length,

        recentActivity,
      };
    },
  },

  Mutation: {},
};

export { dashboardResolvers };