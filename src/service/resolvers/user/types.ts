import { gql } from "graphql-tag";

const userType = gql`
  # -------------------------- User --------------------------

  type User @key(fields: "id") @shareable {
    id: ID!
    auth0Id: String!
    organizationId: Int
    fullName: String
    email: String!
    role: String
    createdAt: Date
    updatedAt: Date

    # Relationships
    organization: Organization
    movements: [SampleMovement!]
    userAlerts: [UserAlert!]
  }

  type ResponseUser {
    data: [User]
    count: Int
    status: Int
    error: String
  }

  input UserCreateInput {
    auth0Id: String!
    organizationId: Int
    fullName: String
    email: String!
    role: String
  }

  input UserWhereUniqueInput {
    id: Int!
  }

  input UserUpdateInput {
    auth0Id: String
    organizationId: Int
    fullName: String
    email: String
    role: String
  }

  input UserWhereFilterInput {
    AND: [UserWhereFilterInput]
    OR: [UserWhereFilterInput]
    NOT: [UserWhereFilterInput]

    id: IntFilter
    auth0Id: StringFilter
    organizationId: IntFilter
    fullName: StringFilter
    email: StringFilter
    role: StringFilter
    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputUser {
    field: UserOrderByField
    value: OrderByDirection
  }

  enum UserOrderByField {
    id
    auth0Id
    organizationId
    fullName
    email
    role
    createdAt
    updatedAt
  }

  # --------------------------
  # Current authenticated user
  # --------------------------

  extend type Query {
    me: User
  }

  extend type Mutation {
    updateMyProfile(fullName: String!): User!
  }
`;

export { userType };