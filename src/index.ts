import "dotenv/config";

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { getDB } from "./service/db";

import {
  getAuth0UserInfo,
  verifyAccessToken,
} from "./service/auth/auth0";

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

    introspection: true,
  });

  const { url } = await startStandaloneServer(
    server,
    {
      context: async ({ req }) => {
        const authorization =
          req.headers.authorization;

        const token = Array.isArray(
          authorization
        )
          ? authorization[0]
          : authorization;

        const origin = req.headers.origin;

        const ip =
          req.socket?.remoteAddress ||
          "unknown";

        let user:
          | {
              id: number;
              auth0Id: string;
            }
          | undefined;

        if (token) {
          // Validate the Auth0 access token
          const identity =
            await verifyAccessToken(token);

          if (identity) {
            // First, try to find an existing OptiLab user
            let databaseUser =
              await db.user.findUnique({
                where: {
                  auth0Id: identity.sub,
                },
                select: {
                  id: true,
                  auth0Id: true,
                },
              });

            // If the Auth0 user does not exist
            // in OptiLab yet, provision it.
            if (!databaseUser) {
              const auth0User =
                await getAuth0UserInfo(
                  token
                );

              if (!auth0User) {
                throw new Error(
                  "Could not retrieve the authenticated Auth0 user."
                );
              }

              // Make sure /userinfo belongs
              // to the same authenticated identity.
              if (
                auth0User.sub !==
                identity.sub
              ) {
                throw new Error(
                  "Auth0 user identity does not match the access token."
                );
              }

              if (!auth0User.email) {
                throw new Error(
                  "The authenticated Auth0 user does not have an email address."
                );
              }

              // Do not automatically link an
              // existing account by email.
              const existingUserByEmail =
                await db.user.findUnique({
                  where: {
                    email:
                      auth0User.email,
                  },
                  select: {
                    id: true,
                    auth0Id: true,
                  },
                });

              if (existingUserByEmail) {
                throw new Error(
                  "A user with this email already exists in OptiLab but is linked to a different authentication identity."
                );
              }

              // Create the OptiLab user
              databaseUser =
                await db.user.create({
                  data: {
                    auth0Id:
                      identity.sub,

                    email:
                      auth0User.email,

                    fullName:
                      auth0User.name?.trim() ||
                      null,

                    role: "TECHNICIAN",

                    organizationId: null,
                  },

                  select: {
                    id: true,
                    auth0Id: true,
                  },
                });
            }

            // The authenticated OptiLab user
            // is now available to resolvers.
            user = databaseUser;
          }
        }

        return {
          db,
          token,
          origin,
          ip,
          user,
        };
      },

      listen: {
        port:
          Number(process.env.PORT) ||
          4000,
      },
    }
  );

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