import {
    PrismaClient,
    Prisma,
} from "../../generated/prisma/client";

type DbClient =
    | PrismaClient
    | Prisma.TransactionClient;

const ALERT_TYPES = {
    EXPIRATION: "EXPIRATION",
    EXPIRATION_WARNING: "EXPIRATION_WARNING",
    STORAGE_REQUIREMENT: "STORAGE_REQUIREMENT",
    HAZARDOUS_MATERIAL: "HAZARDOUS_MATERIAL",
    HIGH_OCCUPANCY: "HIGH_OCCUPANCY",
} as const;

const EXPIRATION_WARNING_DAYS = 30;
const HIGH_OCCUPANCY_THRESHOLD = 90;

async function resolveAlerts(
    db: DbClient,
    where: {
        sampleId?: number;
        storageLocationId?: number;
        alertType: string;
    }
) {
    await db.alert.updateMany({
        where: {
            ...where,
            isResolved: false,
        },
        data: {
            isResolved: true,
            resolvedAt: new Date(),
        },
    });
}

async function findActiveAlert(
    db: DbClient,
    where: {
        sampleId?: number;
        storageLocationId?: number;
        alertType: string;
    }
) {
    return db.alert.findFirst({
        where: {
            ...where,
            isResolved: false,
        },
    });
}

async function syncExpirationAlerts(
    db: DbClient,
    sampleId: number
) {
    const sample = await db.sample.findUnique({
        where: {
            id: sampleId,
        },
    });

    if (!sample) {
        return;
    }

    const expirationTypes = [
        ALERT_TYPES.EXPIRATION,
        ALERT_TYPES.EXPIRATION_WARNING,
    ];

    if (
        sample.status !== "ACTIVE" ||
        !sample.expirationDate
    ) {
        await db.alert.updateMany({
            where: {
                sampleId,
                alertType: {
                    in: expirationTypes,
                },
                isResolved: false,
            },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
            },
        });

        return;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const expirationDate =
        new Date(sample.expirationDate);

    expirationDate.setHours(0, 0, 0, 0);

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    const daysRemaining = Math.ceil(
        (
            expirationDate.getTime() -
            today.getTime()
        ) / millisecondsPerDay
    );

    // ----------------------------------------
    // EXPIRED
    // ----------------------------------------

    if (daysRemaining <= 0) {
        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.EXPIRATION_WARNING,
        });

        const existing =
            await findActiveAlert(db, {
                sampleId,
                alertType:
                    ALERT_TYPES.EXPIRATION,
            });

        if (!existing) {
            await db.alert.create({
                data: {
                    laboratoryId:
                        sample.laboratoryId,

                    storageLocationId:
                        sample.storageLocationId,

                    sampleId,

                    alertType:
                        ALERT_TYPES.EXPIRATION,

                    severity: "HIGH",

                    message:
                        `La muestra ${sample.code} ha alcanzado su fecha de expiración.`,
                },
            });
        }

        return;
    }

    // ----------------------------------------
    // WARNING
    // ----------------------------------------

    if (
        daysRemaining <=
        EXPIRATION_WARNING_DAYS
    ) {
        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.EXPIRATION,
        });

        const existing =
            await findActiveAlert(db, {
                sampleId,
                alertType:
                    ALERT_TYPES.EXPIRATION_WARNING,
            });

        if (!existing) {
            await db.alert.create({
                data: {
                    laboratoryId:
                        sample.laboratoryId,

                    storageLocationId:
                        sample.storageLocationId,

                    sampleId,

                    alertType:
                        ALERT_TYPES.EXPIRATION_WARNING,

                    severity: "MEDIUM",

                    message:
                        `La muestra ${sample.code} vencerá en ${daysRemaining} días.`,
                },
            });
        }

        return;
    }

    // ----------------------------------------
    // NO EXPIRATION ALERT REQUIRED
    // ----------------------------------------

    await db.alert.updateMany({
        where: {
            sampleId,
            alertType: {
                in: expirationTypes,
            },
            isResolved: false,
        },
        data: {
            isResolved: true,
            resolvedAt: new Date(),
        },
    });
}

async function syncStorageRequirementAlerts(
    db: DbClient,
    sampleId: number
) {
    const sample = await db.sample.findUnique({
        where: {
            id: sampleId,
        },
        include: {
            storageLocation: true,
        },
    });

    if (
        !sample ||
        sample.status !== "ACTIVE" ||
        !sample.storageLocation
    ) {
        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.STORAGE_REQUIREMENT,
        });

        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.HAZARDOUS_MATERIAL,
        });

        return;
    }

    const location =
        sample.storageLocation;

    // ----------------------------------------
    // STORAGE REQUIREMENTS
    // ----------------------------------------

    const missingColdStorage =
        sample.requiresColdStorage &&
        !location.supportsColdStorage;

    const missingLightProtection =
        sample.requiresLightProtection &&
        !location.supportsLightProtection;

    if (
        missingColdStorage ||
        missingLightProtection
    ) {
        const requirements: string[] = [];

        if (missingColdStorage) {
            requirements.push(
                "almacenamiento en frío"
            );
        }

        if (missingLightProtection) {
            requirements.push(
                "protección contra la luz"
            );
        }

        const existing =
            await findActiveAlert(db, {
                sampleId,
                alertType:
                    ALERT_TYPES.STORAGE_REQUIREMENT,
            });

        if (!existing) {
            await db.alert.create({
                data: {
                    laboratoryId:
                        sample.laboratoryId,

                    storageLocationId:
                        location.id,

                    sampleId,

                    alertType:
                        ALERT_TYPES.STORAGE_REQUIREMENT,

                    severity: "HIGH",

                    message:
                        `La muestra ${sample.code} requiere ${requirements.join(
                            " y "
                        )}, pero la ubicación actual no cumple esta condición.`,
                },
            });
        }
    } else {
        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.STORAGE_REQUIREMENT,
        });
    }

    // ----------------------------------------
    // HAZARDOUS
    // ----------------------------------------

    const hazardousMismatch =
        sample.isHazardous &&
        !location.supportsHazardous;

    if (hazardousMismatch) {
        const existing =
            await findActiveAlert(db, {
                sampleId,
                alertType:
                    ALERT_TYPES.HAZARDOUS_MATERIAL,
            });

        if (!existing) {
            await db.alert.create({
                data: {
                    laboratoryId:
                        sample.laboratoryId,

                    storageLocationId:
                        location.id,

                    sampleId,

                    alertType:
                        ALERT_TYPES.HAZARDOUS_MATERIAL,

                    severity: "HIGH",

                    message:
                        `La muestra ${sample.code} está marcada como material peligroso, pero su ubicación actual no admite materiales peligrosos.`,
                },
            });
        }
    } else {
        await resolveAlerts(db, {
            sampleId,
            alertType:
                ALERT_TYPES.HAZARDOUS_MATERIAL,
        });
    }
}
async function syncHighOccupancyAlert(
    db: DbClient,
    storageLocationId: number
) {
    const location =
        await db.storageLocation.findUnique({
            where: {
                id: storageLocationId,
            },
        });

    if (!location) {
        return;
    }

    const maxArea =
        location.maxAreaCm2 !== null
            ? Number(location.maxAreaCm2)
            : null;

    if (!maxArea || maxArea <= 0) {
        await resolveAlerts(db, {
            storageLocationId,
            alertType:
                ALERT_TYPES.HIGH_OCCUPANCY,
        });

        return;
    }

    const result =
        await db.sample.aggregate({
            where: {
                storageLocationId,
                status: "ACTIVE",
            },
            _sum: {
                areaCm2: true,
            },
        });

    const usedArea = Number(
        result._sum.areaCm2 ?? 0
    );

    const occupancy =
        (usedArea / maxArea) * 100;

    if (
        occupancy >=
        HIGH_OCCUPANCY_THRESHOLD
    ) {
        const existing =
            await findActiveAlert(db, {
                storageLocationId,
                alertType:
                    ALERT_TYPES.HIGH_OCCUPANCY,
            });

        if (!existing) {
            await db.alert.create({
                data: {
                    laboratoryId:
                        location.laboratoryId,

                    storageLocationId,

                    alertType:
                        ALERT_TYPES.HIGH_OCCUPANCY,

                    severity:
                        occupancy >= 100
                            ? "HIGH"
                            : "MEDIUM",

                    message:
                        `La ubicación ${location.code} tiene ${Math.round(
                            occupancy * 100
                        ) / 100}% de ocupación.`,
                },
            });
        }

        return;
    }

    await resolveAlerts(db, {
        storageLocationId,
        alertType:
            ALERT_TYPES.HIGH_OCCUPANCY,
    });
}


async function syncSampleAlerts(
    db: DbClient,
    sampleId: number
) {
    await syncExpirationAlerts(
        db,
        sampleId
    );

    await syncStorageRequirementAlerts(
        db,
        sampleId
    );
}

export {
    ALERT_TYPES,
    syncSampleAlerts,
    syncExpirationAlerts,
    syncStorageRequirementAlerts,
    syncHighOccupancyAlert,
};