import { gql } from "graphql-tag";

const storageLocationType = gql`
  # -------------------------- StorageLocation --------------------------

  type StorageLocation @key(fields: "id") @shareable {
    id: ID!
    laboratoryId: Int!

    code: String!
    name: String!
    type: String!
    description: String

    maxVolumeCm3: Float
    maxAreaCm2: Float
    maxWeightG: Float

    supportsColdStorage: Boolean!
    supportsLightProtection: Boolean!
    supportsHazardous: Boolean!

    createdAt: Date
    updatedAt: Date

    # Relationships
    laboratory: Laboratory!
    samples: [Sample!]
    alerts: [Alert!]
    movementsFrom: [SampleMovement!]
    movementsTo: [SampleMovement!]
  }

  type StorageRecommendation {
    storageLocation: StorageLocation!

    score: Float!

    availableWeightG: Float
    availableVolumeCm3: Float
    availableAreaCm2: Float

    reasons: [String!]!
}

  type ResponseStorageLocation {
    data: [StorageLocation]
    count: Int
    status: Int
    error: String
  }

  input StorageLocationCreateInput {
    laboratoryId: Int!

    code: String!
    name: String!
    type: String!
    description: String

    maxVolumeCm3: Float
    maxAreaCm2: Float
    maxWeightG: Float

    supportsColdStorage: Boolean
    supportsLightProtection: Boolean
    supportsHazardous: Boolean
  }

  input StorageLocationWhereUniqueInput {
    id: Int!
  }

  input StorageLocationUpdateInput {
    laboratoryId: Int

    code: String
    name: String
    type: String
    description: String

    maxVolumeCm3: Float
    maxAreaCm2: Float
    maxWeightG: Float

    supportsColdStorage: Boolean
    supportsLightProtection: Boolean
    supportsHazardous: Boolean
  }

  input StorageLocationWhereFilterInput {
    AND: [StorageLocationWhereFilterInput]
    OR: [StorageLocationWhereFilterInput]
    NOT: [StorageLocationWhereFilterInput]

    id: IntFilter
    laboratoryId: IntFilter

    code: StringFilter
    name: StringFilter
    type: StringFilter
    description: StringFilter

    maxVolumeCm3: FloatFilter
    maxAreaCm2: FloatFilter
    maxWeightG: FloatFilter

    supportsColdStorage: BooleanFilter
    supportsLightProtection: BooleanFilter
    supportsHazardous: BooleanFilter

    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputStorageLocation {
    field: StorageLocationOrderByField
    value: OrderByDirection
  }

  enum StorageLocationOrderByField {
    id
    laboratoryId
    code
    name
    type
    maxVolumeCm3
    maxAreaCm2
    maxWeightG
    supportsColdStorage
    supportsLightProtection
    supportsHazardous
    createdAt
    updatedAt
  }
`;

export { storageLocationType };