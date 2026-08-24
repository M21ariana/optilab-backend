import { Resolver } from "./types";

import { organizationResolvers } from "./resolvers/organization/resolvers";
import { laboratoryResolvers } from "./resolvers/laboratory/resolvers";
import { materialTypeResolvers } from "./resolvers/materialType/resolvers";
import { storageLocationResolvers } from "./resolvers/storageLocation/resolvers";
import { userResolvers } from "./resolvers/user/resolvers";
import { sampleResolvers } from "./resolvers/sample/resolvers";
import { sampleMovementResolvers } from "./resolvers/sampleMovement/resolvers";
import { alertResolvers } from "./resolvers/alert/resolvers";
import { userAlertResolvers } from "./resolvers/userAlert/resolvers";

const serviceResolvers: Resolver[] = [
  organizationResolvers,
  laboratoryResolvers,
  materialTypeResolvers,
  storageLocationResolvers,
  userResolvers,
  sampleResolvers,
  sampleMovementResolvers,
  alertResolvers,
  userAlertResolvers,
];

const getResolvers = () => {
  const resolvers: Resolver = {
    Query: {},
    Mutation: {},
  };

  serviceResolvers.forEach((resolver) => {
    Object.keys(resolver).forEach((key: string) => {
      if (key !== "Query" && key !== "Mutation") {
        resolvers[key] = resolver[key];
      }
    });

    resolvers.Query = {
      ...resolvers.Query,
      ...resolver.Query,
    };

    resolvers.Mutation = {
      ...resolvers.Mutation,
      ...resolver.Mutation,
    };
  });

  return {
    resolvers,
    serviceResolvers,
  };
};

export {
  getResolvers,
  serviceResolvers,
};