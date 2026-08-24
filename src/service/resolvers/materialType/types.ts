import { gql } from "graphql-tag";

const materialTypeType = gql`
  # -------------------------- MaterialType --------------------------

  type MaterialType @key(fields: "id") @shareable {
    id: ID!
    name: String!
    description: String
    createdAt: Date
    updatedAt: Date

    # Relationships
    samples: [Sample!]
  }

  type ResponseMaterialType {
    data: [MaterialType]
    count: Int
    status: Int
    error: String
  }

  input MaterialTypeCreateInput {
    name: String!
    description: String
  }

  input MaterialTypeWhereUniqueInput {
    id: Int!
  }

  input MaterialTypeUpdateInput {
    name: String
    description: String
  }

  input MaterialTypeWhereFilterInput {
    AND: [MaterialTypeWhereFilterInput]
    OR: [MaterialTypeWhereFilterInput]
    NOT: [MaterialTypeWhereFilterInput]

    id: IntFilter
    name: StringFilter
    description: StringFilter
    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputMaterialType {
    field: MaterialTypeOrderByField
    value: OrderByDirection
  }

  enum MaterialTypeOrderByField {
    id
    name
    description
    createdAt
    updatedAt
  }
`;

export { materialTypeType };