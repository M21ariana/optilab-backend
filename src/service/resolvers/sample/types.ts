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

  # -------------------------- Create --------------------------

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

  # -------------------------- Update --------------------------

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

    movementReason: String
  }

  # -------------------------- Move --------------------------

  input MoveSampleInput {
    sampleId: Int!
    toLocationId: Int!
    notes: String!
  }

  # -------------------------- Remove --------------------------

  input RemoveSampleInput {
    sampleId: Int!
    notes: String!
  }

  # -------------------------- Filters --------------------------

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

    status: EnumSampleStatusFilter
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

  input EnumSampleStatusFilter {
    equals: SampleStatus
    in: [SampleStatus!]
    notIn: [SampleStatus!]
    not: SampleStatus
  }

  # -------------------------- Order --------------------------

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

  # -------------------------- Enums --------------------------

  enum SampleStatus {
    ACTIVE
    REMOVED
    ARCHIVED
    DISCARDED
    EXPIRED
  }
`;

export { sampleType };