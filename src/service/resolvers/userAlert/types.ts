import { gql } from "graphql-tag";

const userAlertType = gql`
  # -------------------------- UserAlert --------------------------

  type UserAlert @key(fields: "id") @shareable {
    id: ID!

    userId: Int!
    alertId: Int!

    isRead: Boolean!
    readAt: Date
    createdAt: Date!

    # Relationships
    user: User!
    alert: Alert!
  }

  type ResponseUserAlert {
    data: [UserAlert]
    count: Int
    status: Int
    error: String
  }

  input UserAlertCreateInput {
    userId: Int!
    alertId: Int!
    isRead: Boolean
    readAt: Date
  }

  input UserAlertWhereUniqueInput {
    id: Int!
  }

  input UserAlertUpdateInput {
    userId: Int
    alertId: Int
    isRead: Boolean
    readAt: Date
  }

  input UserAlertWhereFilterInput {
    AND: [UserAlertWhereFilterInput]
    OR: [UserAlertWhereFilterInput]
    NOT: [UserAlertWhereFilterInput]

    id: IntFilter
    userId: IntFilter
    alertId: IntFilter
    isRead: BooleanFilter
    readAt: DateFilter
    createdAt: DateFilter
  }

  input OrderByInputUserAlert {
    field: UserAlertOrderByField
    value: OrderByDirection
  }

  enum UserAlertOrderByField {
    id
    userId
    alertId
    isRead
    readAt
    createdAt
  }
`;

export { userAlertType };