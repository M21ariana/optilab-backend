import { PrismaClient } from "../../generated/prisma/client";

import {
  StorageRecommendation,
  StorageRequirements,
} from "./types";

function decimalToNumber(
  value: unknown
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export async function recommendStorageLocations(
  db: PrismaClient,
  requirements: StorageRequirements
): Promise<StorageRecommendation[]> {
  // ------------------------------------------------------
  // 1. Get every location in the sample's laboratory
  // ------------------------------------------------------

  const locations =
    await db.storageLocation.findMany({
      where: {
        laboratoryId:
          requirements.laboratoryId,
      },

      include: {
        samples: {
          where: {
            status: "ACTIVE",

            ...(requirements.excludeSampleId
              ? {
                  id: {
                    not: requirements.excludeSampleId,
                  },
                }
              : {}),
          },

          select: {
            id: true,
            weightG: true,
            volumeCm3: true,
            areaCm2: true,
          },
        },
      },
    });

  const recommendations: StorageRecommendation[] =
    [];

  // ------------------------------------------------------
  // 2. Evaluate each location individually
  // ------------------------------------------------------

  for (const location of locations) {
    // ----------------------------------------------------
    // Environmental restrictions
    // ----------------------------------------------------

    if (
      requirements.requiresColdStorage &&
      !location.supportsColdStorage
    ) {
      continue;
    }

    if (
      requirements.requiresLightProtection &&
      !location.supportsLightProtection
    ) {
      continue;
    }

    if (
      requirements.isHazardous &&
      !location.supportsHazardous
    ) {
      continue;
    }

    // ----------------------------------------------------
    // Maximum capacity
    // ----------------------------------------------------

    const maxWeightG = decimalToNumber(
      location.maxWeightG
    );

    const maxVolumeCm3 = decimalToNumber(
      location.maxVolumeCm3
    );

    const maxAreaCm2 = decimalToNumber(
      location.maxAreaCm2
    );

    // ----------------------------------------------------
    // Current occupancy
    // ----------------------------------------------------

    const occupiedWeightG =
      location.samples.reduce(
        (total, sample) =>
          total + Number(sample.weightG),
        0
      );

    const occupiedVolumeCm3 =
      location.samples.reduce(
        (total, sample) =>
          total + Number(sample.volumeCm3),
        0
      );

    const occupiedAreaCm2 =
      location.samples.reduce(
        (total, sample) =>
          total + Number(sample.areaCm2),
        0
      );

    // ----------------------------------------------------
    // Available capacity
    // null = unlimited / not constrained
    // ----------------------------------------------------

    const availableWeightG =
      maxWeightG === null
        ? null
        : Math.max(
            0,
            maxWeightG - occupiedWeightG
          );

    const availableVolumeCm3 =
      maxVolumeCm3 === null
        ? null
        : Math.max(
            0,
            maxVolumeCm3 - occupiedVolumeCm3
          );

    const availableAreaCm2 =
      maxAreaCm2 === null
        ? null
        : Math.max(
            0,
            maxAreaCm2 - occupiedAreaCm2
          );

    // ----------------------------------------------------
    // Capacity compatibility
    // ----------------------------------------------------

    if (
      availableWeightG !== null &&
      requirements.weightG >
        availableWeightG
    ) {
      continue;
    }

    if (
      availableVolumeCm3 !== null &&
      requirements.volumeCm3 >
        availableVolumeCm3
    ) {
      continue;
    }

    if (
      availableAreaCm2 !== null &&
      requirements.areaCm2 >
        availableAreaCm2
    ) {
      continue;
    }

    // ----------------------------------------------------
    // 3. Score
    // ----------------------------------------------------

    let score = 100;

    const reasons: string[] = [];

    reasons.push(
      "Cumple con las restricciones de almacenamiento."
    );

    reasons.push(
      "Tiene capacidad suficiente para la muestra."
    );

    // ----------------------------------------------------
    // Space utilization
    //
    // Prefer a location that fits the sample without
    // wasting excessive capacity.
    // ----------------------------------------------------

    const utilizationScores: number[] = [];

    if (
      availableWeightG !== null &&
      availableWeightG > 0
    ) {
      utilizationScores.push(
        requirements.weightG /
          availableWeightG
      );
    }

    if (
      availableVolumeCm3 !== null &&
      availableVolumeCm3 > 0
    ) {
      utilizationScores.push(
        requirements.volumeCm3 /
          availableVolumeCm3
      );
    }

    if (
      availableAreaCm2 !== null &&
      availableAreaCm2 > 0
    ) {
      utilizationScores.push(
        requirements.areaCm2 /
          availableAreaCm2
      );
    }

    if (utilizationScores.length > 0) {
      const averageUtilization =
        utilizationScores.reduce(
          (total, value) => total + value,
          0
        ) / utilizationScores.length;

      /*
       * A location where the sample uses more of the
       * available space receives a better score.
       *
       * We reserve 30 points for space efficiency.
       */

      const spaceScore =
        Math.min(
          1,
          averageUtilization
        ) * 30;

      score = 70 + spaceScore;

      if (averageUtilization >= 0.5) {
        reasons.push(
          "Ofrece un buen aprovechamiento del espacio disponible."
        );
      } else {
        reasons.push(
          "Dispone de espacio suficiente con capacidad adicional."
        );
      }
    }

    // ----------------------------------------------------
    // 4. Recommendation
    // ----------------------------------------------------

    recommendations.push({
      storageLocation: {
        id: location.id,

        laboratoryId:
          location.laboratoryId,

        code: location.code,

        name: location.name,

        type: location.type,

        description:
          location.description,

        maxWeightG,
        maxVolumeCm3,
        maxAreaCm2,

        supportsColdStorage:
          location.supportsColdStorage,

        supportsLightProtection:
          location.supportsLightProtection,

        supportsHazardous:
          location.supportsHazardous,
      },

      score:
        Math.round(score * 100) / 100,

      availableWeightG,
      availableVolumeCm3,
      availableAreaCm2,

      reasons,
    });
  }

  // ------------------------------------------------------
  // 5. Best recommendation first
  // ------------------------------------------------------

  return recommendations.sort(
    (a, b) => b.score - a.score
  );
}

export async function recommendStorageLocationsForSample(
  db: PrismaClient,
  sampleId: number
): Promise<StorageRecommendation[]> {
  const sample = await db.sample.findUnique({
    where: {
      id: sampleId,
    },

    select: {
      id: true,
      laboratoryId: true,

      weightG: true,
      volumeCm3: true,
      areaCm2: true,

      requiresColdStorage: true,
      requiresLightProtection: true,
      isHazardous: true,
    },
  });

  if (!sample) {
    throw new Error(
      `Sample with id ${sampleId} was not found.`
    );
  }

  return recommendStorageLocations(db, {
    laboratoryId: sample.laboratoryId,

    weightG: Number(sample.weightG),
    volumeCm3: Number(sample.volumeCm3),
    areaCm2: Number(sample.areaCm2),

    requiresColdStorage:
      sample.requiresColdStorage,

    requiresLightProtection:
      sample.requiresLightProtection,

    isHazardous:
      sample.isHazardous,

    // Important when editing:
    // don't count the sample against itself.
    excludeSampleId: sample.id,
  });
}