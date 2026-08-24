import { gql } from "graphql-tag";

const laboratoryType = gql`
  # -------------------------- Laboratory --------------------------

  type Laboratory @key(fields: "id") @shareable {
    id: ID!
    organizationId: Int!
    name: String!
    description: String
    createdAt: Date
    updatedAt: Date

    # Relationships
    organization: Organization!
    storageLocations: [StorageLocation!]
    samples: [Sample!]
    alerts: [Alert!]
  }

  type ResponseLaboratory {
    data: [Laboratory]
    count: Int
    status: Int
    error: String
  }

  input LaboratoryCreateInput {
    organizationId: Int!
    name: String!
    description: String
  }

  input LaboratoryWhereUniqueInput {
    id: Int!
  }

  input LaboratoryUpdateInput {
    organizationId: Int
    name: String
    description: String
  }

  input LaboratoryWhereFilterInput {
    AND: [LaboratoryWhereFilterInput]
    OR: [LaboratoryWhereFilterInput]
    NOT: [LaboratoryWhereFilterInput]

    id: IntFilter
    organizationId: IntFilter
    name: StringFilter
    description: StringFilter
    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputLaboratory {
    field: LaboratoryOrderByField
    value: OrderByDirection
  }

  enum LaboratoryOrderByField {
    id
    organizationId
    name
    description
    createdAt
    updatedAt
  }
`;

export { laboratoryType };