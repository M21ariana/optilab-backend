import { gql } from "graphql-tag";

const alertType = gql`
  # -------------------------- Alert --------------------------

  type Alert @key(fields: "id") @shareable {
    id: ID!

    laboratoryId: Int
    storageLocationId: Int
    sampleId: Int

    alertType: String!
    severity: String!
    message: String!

    isResolved: Boolean!
    resolvedAt: Date

    createdAt: Date
    updatedAt: Date

    # Relationships
    laboratory: Laboratory
    storageLocation: StorageLocation
    sample: Sample
    userAlerts: [UserAlert!]
  }

  type ResponseAlert {
    data: [Alert]
    count: Int
    status: Int
    error: String
  }

  input AlertCreateInput {
    laboratoryId: Int
    storageLocationId: Int
    sampleId: Int

    alertType: String!
    severity: String
    message: String!

    isResolved: Boolean
    resolvedAt: Date
  }

  input AlertWhereUniqueInput {
    id: Int!
  }

  input AlertUpdateInput {
    laboratoryId: Int
    storageLocationId: Int
    sampleId: Int

    alertType: String
    severity: String
    message: String

    isResolved: Boolean
    resolvedAt: Date
  }

  input AlertWhereFilterInput {
    AND: [AlertWhereFilterInput]
    OR: [AlertWhereFilterInput]
    NOT: [AlertWhereFilterInput]

    id: IntFilter
    laboratoryId: IntFilter
    storageLocationId: IntFilter
    sampleId: IntFilter

    alertType: StringFilter
    severity: StringFilter
    message: StringFilter

    isResolved: BooleanFilter
    resolvedAt: DateFilter
    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputAlert {
    field: AlertOrderByField
    value: OrderByDirection
  }

  enum AlertOrderByField {
    id
    laboratoryId
    storageLocationId
    sampleId
    alertType
    severity
    isResolved
    resolvedAt
    createdAt
    updatedAt
  }
`;

export { alertType };