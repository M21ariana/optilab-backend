import DataLoader from "dataloader";

import {
  PrismaClient,
  Sample,
} from "../../../generated/prisma/client";

const samplesLoader =
  (db: PrismaClient) =>
  async (
    materialTypeIds: readonly number[]
  ): Promise<Sample[][]> => {
    const samples = await db.sample.findMany({
      where: {
        materialTypeId: {
          in: [...materialTypeIds],
        },
      },
    });

    return materialTypeIds.map((materialTypeId) =>
      samples.filter(
        (sample) =>
          sample.materialTypeId === materialTypeId
      )
    );
  };

const materialTypeDataLoader = (
  db: PrismaClient
) => ({
  samplesLoader: new DataLoader<
    number,
    Sample[]
  >(samplesLoader(db)),
});

export { materialTypeDataLoader };