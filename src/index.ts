import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { getDB } from "./service/db";

import { generalTypes } from "./service/resolvers/general/types";

import { organizationType } from "./service/resolvers/organization/types";
import { organizationResolvers } from "./service/resolvers/organization/resolvers";

import { laboratoryType } from "./service/resolvers/laboratory/types";
import { laboratoryResolvers } from "./service/resolvers/laboratory/resolvers";

import { materialTypeType } from "./service/resolvers/materialType/types";
import { materialTypeResolvers } from "./service/resolvers/materialType/resolvers";

import { storageLocationType } from "./service/resolvers/storageLocation/types";
import { storageLocationResolvers } from "./service/resolvers/storageLocation/resolvers";

import { userType } from "./service/resolvers/user/types";
import { userResolvers } from "./service/resolvers/user/resolvers";

import { sampleType } from "./service/resolvers/sample/types";
import { sampleResolvers } from "./service/resolvers/sample/resolvers";

import { sampleMovementType } from "./service/resolvers/sampleMovement/types";
import { sampleMovementResolvers } from "./service/resolvers/sampleMovement/resolvers";

import { alertType } from "./service/resolvers/alert/types";
import { alertResolvers } from "./service/resolvers/alert/resolvers";

import { userAlertType } from "./service/resolvers/userAlert/types";
import { userAlertResolvers } from "./service/resolvers/userAlert/resolvers";

const main = async () => {
  const db = await getDB();

  const server = new ApolloServer({
    schema: buildSubgraphSchema([
      {
        typeDefs: generalTypes,
      },

      {
        typeDefs: organizationType,
        resolvers: organizationResolvers,
      },

      {
        typeDefs: laboratoryType,
        resolvers: laboratoryResolvers,
      },

      {
        typeDefs: materialTypeType,
        resolvers: materialTypeResolvers,
      },

      {
        typeDefs: storageLocationType,
        resolvers: storageLocationResolvers,
      },

      {
        typeDefs: userType,
        resolvers: userResolvers,
      },

      {
        typeDefs: sampleType,
        resolvers: sampleResolvers,
      },

      {
        typeDefs: sampleMovementType,
        resolvers: sampleMovementResolvers,
      },

      {
        typeDefs: alertType,
        resolvers: alertResolvers,
      },

      {
        typeDefs: userAlertType,
        resolvers: userAlertResolvers,
      },
    ]),
  });

  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      const authorization =
        req.headers.authorization;

      const token = Array.isArray(authorization)
        ? authorization[0]
        : authorization;

      const origin =
        req.headers.origin;

      const ip =
        req.socket?.remoteAddress ||
        "unknown";

      return {
        db,
        token,
        origin,
        ip,
      };
    },

    listen: {
      port:
        Number(process.env.PORT) ||
        4000,
    },
  });

  console.log(
    `🚀 OptiLab Server ready at ${url}`
  );
};

main().catch((error) => {
  console.error(
    "❌ Error starting OptiLab Server:"
  );

  console.error(error);
});