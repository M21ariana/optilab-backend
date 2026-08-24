import { gql } from "graphql-tag";

const sampleMovementType = gql`
  # -------------------------- SampleMovement --------------------------

  type SampleMovement @key(fields: "id") @shareable {
    id: ID!

    sampleId: Int!
    fromLocationId: Int
    toLocationId: Int
    movementType: String!
    notes: String
    performedByUserId: Int
    createdAt: Date!

    # Relationships
    sample: Sample!
    fromLocation: StorageLocation
    toLocation: StorageLocation
    performedBy: User
  }

  type ResponseSampleMovement {
    data: [SampleMovement]
    count: Int
    status: Int
    error: String
  }

  input SampleMovementCreateInput {
    sampleId: Int!
    fromLocationId: Int
    toLocationId: Int
    movementType: String!
    notes: String
    performedByUserId: Int
  }

  input SampleMovementWhereUniqueInput {
    id: Int!
  }

  input SampleMovementUpdateInput {
    sampleId: Int
    fromLocationId: Int
    toLocationId: Int
    movementType: String
    notes: String
    performedByUserId: Int
  }

  input SampleMovementWhereFilterInput {
    AND: [SampleMovementWhereFilterInput]
    OR: [SampleMovementWhereFilterInput]
    NOT: [SampleMovementWhereFilterInput]

    id: IntFilter
    sampleId: IntFilter
    fromLocationId: IntFilter
    toLocationId: IntFilter
    movementType: StringFilter
    notes: StringFilter
    performedByUserId: IntFilter
    createdAt: DateFilter
  }

  input OrderByInputSampleMovement {
    field: SampleMovementOrderByField
    value: OrderByDirection
  }

  enum SampleMovementOrderByField {
    id
    sampleId
    fromLocationId
    toLocationId
    movementType
    performedByUserId
    createdAt
  }
`;

export { sampleMovementType };