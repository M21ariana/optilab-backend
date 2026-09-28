import { Resolver } from "../../types";

// ======================================================
// CONSTANTS
// ======================================================

const CRITICAL_OCCUPANCY_THRESHOLD = 90;

const EXPIRATION_RANGES = {
  EXPIRED: "EXPIRED",
  NEXT_7_DAYS: "NEXT_7_DAYS",
  NEXT_30_DAYS: "NEXT_30_DAYS",
  LATER: "LATER",
} as const;

// ======================================================
// REPORT RESOLVERS
// ======================================================

const reportResolvers: Resolver = {
  Query: {
    reportsDashboard: async (
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

      const organizationId =
        user.organizationId;

      // ----------------------------------------
      // DATES
      // ----------------------------------------

      const now = new Date();

      const thirtyDaysAgo =
        new Date(now);

      thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30
      );

      // ----------------------------------------
      // ORGANIZATION FILTERS
      // ----------------------------------------

      const laboratoryFilter = {
        organizationId,
      };

      const sampleFilter = {
        laboratory: {
          organizationId,
        },
      };

      // ----------------------------------------
      // LOAD REPORT DATA
      // ----------------------------------------

      const [
        locations,
        activeSamples,
        movementsLast30Days,
        activeCriticalAlerts,
      ] = await Promise.all([
        // --------------------------------------
        // STORAGE LOCATIONS
        // --------------------------------------

        db.storageLocation.findMany({
          where: {
            laboratory: laboratoryFilter,
          },

          select: {
            id: true,
            code: true,
            name: true,
            maxAreaCm2: true,

            samples: {
              where: {
                status: "ACTIVE",
              },

              select: {
                id: true,
                areaCm2: true,
              },
            },
          },
        }),

        // --------------------------------------
        // ACTIVE SAMPLES
        // --------------------------------------

        db.sample.findMany({
          where: {
            ...sampleFilter,
            status: "ACTIVE",
          },

          select: {
            id: true,
            materialTypeId: true,
            expirationDate: true,

            materialType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),

        // --------------------------------------
        // MOVEMENTS - LAST 30 DAYS
        // --------------------------------------

        db.sampleMovement.findMany({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
            },

            sample: sampleFilter,
          },

          select: {
            id: true,
            movementType: true,
            createdAt: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        }),

        // --------------------------------------
        // ACTIVE CRITICAL ALERTS
        // --------------------------------------

        db.alert.count({
          where: {
            isResolved: false,
            severity: "HIGH",

            laboratory: {
              organizationId,
            },
          },
        }),
      ]);

      // ==================================================
      // OCCUPANCY BY LOCATION
      // ==================================================

      const occupancyByLocation =
        locations.map((location) => {
          const maxAreaCm2 =
            location.maxAreaCm2 !== null
              ? Number(
                  location.maxAreaCm2
                )
              : 0;

          const usedAreaCm2 =
            location.samples.reduce(
              (total, sample) =>
                total +
                Number(sample.areaCm2),
              0
            );

          const occupancy =
            maxAreaCm2 > 0
              ? Math.round(
                  (usedAreaCm2 /
                    maxAreaCm2) *
                    10000
                ) / 100
              : 0;

          return {
            locationId: location.id,
            code: location.code,
            name: location.name,

            usedAreaCm2,
            maxAreaCm2,
            occupancy,

            sampleCount:
              location.samples.length,
          };
        });

      // ==================================================
      // OVERALL OCCUPANCY
      // ==================================================
      //
      // Important:
      // We calculate:
      //
      // total used area / total available area
      //
      // rather than averaging location percentages.
      // ==================================================

      const totalMaxArea =
        occupancyByLocation.reduce(
          (total, location) =>
            total +
            location.maxAreaCm2,
          0
        );

      const totalUsedArea =
        occupancyByLocation.reduce(
          (total, location) =>
            total +
            location.usedAreaCm2,
          0
        );

      const overallOccupancy =
        totalMaxArea > 0
          ? Math.round(
              (totalUsedArea /
                totalMaxArea) *
                10000
            ) / 100
          : 0;

      // ==================================================
      // SAMPLES BY MATERIAL TYPE
      // ==================================================

      const materialTypeMap =
        new Map<
          number,
          {
            materialTypeId: number;
            name: string;
            count: number;
          }
        >();

      for (const sample of activeSamples) {
        const existing =
          materialTypeMap.get(
            sample.materialType.id
          );

        if (existing) {
          existing.count += 1;
        } else {
          materialTypeMap.set(
            sample.materialType.id,
            {
              materialTypeId:
                sample.materialType.id,

              name:
                sample.materialType.name,

              count: 1,
            }
          );
        }
      }

      const samplesByMaterialType =
        Array.from(
          materialTypeMap.values()
        ).sort(
          (a, b) =>
            b.count - a.count
        );

      // ==================================================
      // MOVEMENT TREND
      // ==================================================

      const movementTrendMap =
        new Map<string, number>();

      for (
        const movement of
        movementsLast30Days
      ) {
        const date =
          movement.createdAt
            .toISOString()
            .slice(0, 10);

        movementTrendMap.set(
          date,
          (movementTrendMap.get(date) ??
            0) + 1
        );
      }

      const movementTrend =
        Array.from(
          movementTrendMap.entries()
        )
          .map(([date, count]) => ({
            date,
            count,
          }))
          .sort((a, b) =>
            a.date.localeCompare(b.date)
          );

      // ==================================================
      // INVENTORY FLOW
      // ==================================================

      const inventoryFlowMap =
        new Map<string, number>();

      for (
        const movement of
        movementsLast30Days
      ) {
        inventoryFlowMap.set(
          movement.movementType,

          (inventoryFlowMap.get(
            movement.movementType
          ) ?? 0) + 1
        );
      }

      const inventoryFlow =
        Array.from(
          inventoryFlowMap.entries()
        ).map(
          ([
            movementType,
            count,
          ]) => ({
            movementType,
            count,
          })
        );

      // ==================================================
      // EXPIRATIONS
      // ==================================================

      const expirationCounts = {
        [EXPIRATION_RANGES.EXPIRED]: 0,

        [EXPIRATION_RANGES.NEXT_7_DAYS]:
          0,

        [EXPIRATION_RANGES.NEXT_30_DAYS]:
          0,

        [EXPIRATION_RANGES.LATER]: 0,
      };

      const today =
        new Date();

      today.setHours(0, 0, 0, 0);

      const millisecondsPerDay =
        1000 * 60 * 60 * 24;

      for (const sample of activeSamples) {
        if (!sample.expirationDate) {
          continue;
        }

        const expirationDate =
          new Date(
            sample.expirationDate
          );

        expirationDate.setHours(
          0,
          0,
          0,
          0
        );

        const daysRemaining =
          Math.ceil(
            (
              expirationDate.getTime() -
              today.getTime()
            ) /
              millisecondsPerDay
          );

        if (daysRemaining <= 0) {
          expirationCounts.EXPIRED +=
            1;
        } else if (
          daysRemaining <= 7
        ) {
          expirationCounts.NEXT_7_DAYS +=
            1;
        } else if (
          daysRemaining <= 30
        ) {
          expirationCounts.NEXT_30_DAYS +=
            1;
        } else {
          expirationCounts.LATER +=
            1;
        }
      }

      const expirations = [
        {
          range:
            EXPIRATION_RANGES.EXPIRED,

          count:
            expirationCounts.EXPIRED,
        },

        {
          range:
            EXPIRATION_RANGES.NEXT_7_DAYS,

          count:
            expirationCounts.NEXT_7_DAYS,
        },

        {
          range:
            EXPIRATION_RANGES.NEXT_30_DAYS,

          count:
            expirationCounts.NEXT_30_DAYS,
        },

        {
          range:
            EXPIRATION_RANGES.LATER,

          count:
            expirationCounts.LATER,
        },
      ];

      // ==================================================
      // CRITICAL LOCATIONS
      // ==================================================

      const criticalLocations =
        occupancyByLocation
          .filter(
            (location) =>
              location.occupancy >=
              CRITICAL_OCCUPANCY_THRESHOLD
          )
          .sort(
            (a, b) =>
              b.occupancy -
              a.occupancy
          )
          .map((location) => ({
            locationId:
              location.locationId,

            code:
              location.code,

            name:
              location.name,

            occupancy:
              location.occupancy,

            sampleCount:
              location.sampleCount,
          }));

      // ==================================================
      // RESPONSE
      // ==================================================

      return {
        summary: {
          overallOccupancy,

          activeSamples:
            activeSamples.length,

          movementsLast30Days:
            movementsLast30Days.length,

          criticalAlerts:
            activeCriticalAlerts,
        },

        occupancyByLocation:
          occupancyByLocation.map(
            (location) => ({
              locationId:
                location.locationId,

              code:
                location.code,

              name:
                location.name,

              usedAreaCm2:
                location.usedAreaCm2,

              maxAreaCm2:
                location.maxAreaCm2,

              occupancy:
                location.occupancy,
            })
          ),

        samplesByMaterialType,

        movementTrend,

        inventoryFlow,

        expirations,

        criticalLocations,
      };
    },
  },
  Mutation: {},
};

export { reportResolvers };