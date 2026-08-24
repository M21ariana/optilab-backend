import { gql } from "graphql-tag";

const organizationType = gql`
  # -------------------------- Organization --------------------------

  type Organization {
    id: ID!
    name: String!
    createdAt: Date
    updatedAt: Date

    # Relationships
    laboratories: [Laboratory!]
    users: [User!]
  }

  type ResponseOrganization {
    data: [Organization]
    count: Int
    status: Int
    error: String
  }

  input OrganizationCreateInput {
    name: String!
  }

  input OrganizationWhereUniqueInput {
    id: Int!
  }

  input OrganizationUpdateInput {
    name: String
  }

  input OrganizationWhereFilterInput {
    AND: [OrganizationWhereFilterInput]
    OR: [OrganizationWhereFilterInput]
    NOT: [OrganizationWhereFilterInput]

    id: IntFilter
    name: StringFilter
    createdAt: DateFilter
    updatedAt: DateFilter
  }

  input OrderByInputOrganization {
    field: OrganizationOrderByField
    value: OrderByDirection
  }

  enum OrganizationOrderByField {
    id
    name
    createdAt
    updatedAt
  }
`;

export { organizationType };