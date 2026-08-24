import { gql } from "graphql-tag";

const sampleType = gql`
  # -------------------------- Sample --------------------------

  type Sample @key(fields: "id") @shareable {
    id: ID!

    laboratoryId: Int!
    storageLocationId: Int
    materialTypeId: Int!

    name: String!
    code: String!
    description: String

    weightG: Float!
    volumeCm3: Float!
    areaCm2: Float!

    status: SampleStatus!
    entryDate: Date!
    expirationDate: Date

    isStackable: Boolean!
    maxStackUnits: Int
    requiresColdStorage: Boolean!
    requiresLightProtection: Boolean!
    isHazardous: Boolean!

    createdAt: Date
    updatedAt: Date

    # Relationships
    laboratory: Laboratory!
    materialType: MaterialType!
    storageLocation: StorageLocation
    movements: [SampleMovement!]
    alerts: [Alert!]
  }

  type ResponseSample {
    data: [Sample]
    count: Int
    status: Int
    error: String
  }

  input SampleCreateInput {
    laboratoryId: Int!
    storageLocationId: Int
    materialTypeId: Int!

    name: String!
    code: String!
    description: String

    weightG: Float!
    volumeCm3: Float!
    areaCm2: Float!

    status: SampleStatus
    entryDate: Date
    expirationDate: Date

    isStackable: Boolean
    maxStackUnits: Int
    requiresColdStorage: Boolean
    requiresLightProtection: Boolean
    isHazardous: Boolean
  }

  input SampleWhereUniqueInput {
    id: Int!
  }

  input SampleUpdateInput {
    laboratoryId: Int
    storageLocationId: Int
    materialTypeId: Int

    name: String
    code: String
    description: String

    weightG: Float
    volumeCm3: Float
    areaCm2: Float

    status: SampleStatus
    entryDate: Date
    expirationDate: Date

    isStackable: Boolean
    maxStackUnits: Int
    requiresColdStorage: Boolean
    requiresLightProtection: Boolean
    isHazardous: Boolean
  }

  input SampleWhereFilterInput {
    AND: [SampleWhereFilterInput]
    OR: [SampleWhereFilterInput]
    NOT: [SampleWhereFilterInput]

    id: IntFilter
    laboratoryId: IntFilter
    storageLocationId: IntFilter
    materialTypeId: IntFilter

    name: StringFilter
    code: StringFilter
    description: StringFilter

    weightG: FloatFilter
    volumeCm3: FloatFilter
    areaCm2: FloatFilter

    entryDate: DateFilter
    expirationDate: DateFilter
    createdAt: DateFilter
    updatedAt: DateFilter

    isStackable: BooleanFilter
    maxStackUnits: IntFilter
    requiresColdStorage: BooleanFilter
    requiresLightProtection: BooleanFilter
    isHazardous: BooleanFilter
  }

  input OrderByInputSample {
    field: SampleOrderByField
    value: OrderByDirection
  }

  enum SampleOrderByField {
    id
    laboratoryId
    storageLocationId
    materialTypeId
    name
    code
    weightG
    volumeCm3
    areaCm2
    status
    entryDate
    expirationDate
    createdAt
    updatedAt
  }

  enum SampleStatus {
    ACTIVE
    ARCHIVED
    DISCARDED
    EXPIRED
  }
`;

export { sampleType };