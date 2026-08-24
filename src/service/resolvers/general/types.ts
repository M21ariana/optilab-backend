import { gql } from "graphql-tag";

const generalTypes = gql`
  extend schema
    @link(
      url: "https://specs.apollo.dev/federation/v2.0"
      import: ["@key", "@shareable"]
    )

  scalar Date
  scalar JSON

  # ======================================================
  # FILTERS
  # ======================================================

  input IntFilter {
    equals: Int
    lt: Int
    lte: Int
    gt: Int
    gte: Int
  }

  input FloatFilter {
    equals: Float
    lt: Float
    lte: Float
    gt: Float
    gte: Float
  }

  input BooleanFilter {
    equals: Boolean
  }

  input JSONFilter {
    array_contains: JSON
    array_ends_with: String
    array_starts_with: String
    equals: JSON
    string_contains: String
    string_ends_with: String
    string_starts_with: String
    not: JSON
  }

  input StringFilter {
    equals: String
    contains: String
    in: [String!]
    notIn: [String!]
    lt: String
    lte: String
    gt: String
    gte: String
    startsWith: String
    endsWith: String
    mode: String
  }

  input DateFilter {
    equals: String
    lt: String
    lte: String
    gt: String
    gte: String
    not: String
  }

  # ======================================================
  # SEARCH
  # ======================================================

  input SearchInput {
    value: String
    columns: JSON
  }

  # ======================================================
  # ORDER
  # ======================================================

  enum OrderByDirection {
    asc
    desc
  }

  # ======================================================
  # MUTATIONS
  # ======================================================

  type Mutation {
    # ------------------------------------------------------
    # Organization
    # ------------------------------------------------------

    createOrganization(
      data: OrganizationCreateInput
    ): Organization

    updateOrganization(
      where: OrganizationWhereUniqueInput!
      data: OrganizationUpdateInput
    ): Organization

    upsertOrganization(
      where: OrganizationWhereUniqueInput!
      data: OrganizationCreateInput
    ): Organization

    deleteOrganization(
      where: OrganizationWhereUniqueInput!
    ): Organization


    # ------------------------------------------------------
    # Laboratory
    # ------------------------------------------------------

    createLaboratory(
      data: LaboratoryCreateInput
    ): Laboratory

    updateLaboratory(
      where: LaboratoryWhereUniqueInput!
      data: LaboratoryUpdateInput
    ): Laboratory

    upsertLaboratory(
      where: LaboratoryWhereUniqueInput!
      data: LaboratoryCreateInput
    ): Laboratory

    deleteLaboratory(
      where: LaboratoryWhereUniqueInput!
    ): Laboratory


    # ------------------------------------------------------
    # MaterialType
    # ------------------------------------------------------

    createMaterialType(
      data: MaterialTypeCreateInput
    ): MaterialType

    updateMaterialType(
      where: MaterialTypeWhereUniqueInput!
      data: MaterialTypeUpdateInput
    ): MaterialType

    upsertMaterialType(
      where: MaterialTypeWhereUniqueInput!
      data: MaterialTypeCreateInput
    ): MaterialType

    deleteMaterialType(
      where: MaterialTypeWhereUniqueInput!
    ): MaterialType


    # ------------------------------------------------------
    # StorageLocation
    # ------------------------------------------------------

    createStorageLocation(
      data: StorageLocationCreateInput
    ): StorageLocation

    updateStorageLocation(
      where: StorageLocationWhereUniqueInput!
      data: StorageLocationUpdateInput
    ): StorageLocation

    upsertStorageLocation(
      where: StorageLocationWhereUniqueInput!
      data: StorageLocationCreateInput
    ): StorageLocation

    deleteStorageLocation(
      where: StorageLocationWhereUniqueInput!
    ): StorageLocation


    # ------------------------------------------------------
    # User
    # ------------------------------------------------------

    createUser(
      data: UserCreateInput
    ): User

    updateUser(
      where: UserWhereUniqueInput!
      data: UserUpdateInput
    ): User

    upsertUser(
      where: UserWhereUniqueInput!
      data: UserCreateInput
    ): User

    deleteUser(
      where: UserWhereUniqueInput!
    ): User


    # ------------------------------------------------------
    # Sample
    # ------------------------------------------------------

    createSample(
      data: SampleCreateInput
    ): Sample

    updateSample(
      where: SampleWhereUniqueInput!
      data: SampleUpdateInput
    ): Sample

    upsertSample(
      where: SampleWhereUniqueInput!
      data: SampleCreateInput
    ): Sample

    deleteSample(
      where: SampleWhereUniqueInput!
    ): Sample


    # ------------------------------------------------------
    # SampleMovement
    # ------------------------------------------------------

    createSampleMovement(
      data: SampleMovementCreateInput
    ): SampleMovement

    updateSampleMovement(
      where: SampleMovementWhereUniqueInput!
      data: SampleMovementUpdateInput
    ): SampleMovement

    upsertSampleMovement(
      where: SampleMovementWhereUniqueInput!
      data: SampleMovementCreateInput
    ): SampleMovement

    deleteSampleMovement(
      where: SampleMovementWhereUniqueInput!
    ): SampleMovement


    # ------------------------------------------------------
    # Alert
    # ------------------------------------------------------

    createAlert(
      data: AlertCreateInput
    ): Alert

    updateAlert(
      where: AlertWhereUniqueInput!
      data: AlertUpdateInput
    ): Alert

    upsertAlert(
      where: AlertWhereUniqueInput!
      data: AlertCreateInput
    ): Alert

    deleteAlert(
      where: AlertWhereUniqueInput!
    ): Alert


    # ------------------------------------------------------
    # UserAlert
    # ------------------------------------------------------

    createUserAlert(
      data: UserAlertCreateInput
    ): UserAlert

    updateUserAlert(
      where: UserAlertWhereUniqueInput!
      data: UserAlertUpdateInput
    ): UserAlert

    upsertUserAlert(
      where: UserAlertWhereUniqueInput!
      data: UserAlertCreateInput
    ): UserAlert

    deleteUserAlert(
      where: UserAlertWhereUniqueInput!
    ): UserAlert
  }

  # ======================================================
  # QUERIES
  # ======================================================

  type Query {
    # ------------------------------------------------------
    # Organization
    # ------------------------------------------------------

    organizations(
      where: OrganizationWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputOrganization
    ): ResponseOrganization

    organization(
      id: Int!
    ): Organization


    # ------------------------------------------------------
    # Laboratory
    # ------------------------------------------------------

    laboratories(
      where: LaboratoryWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputLaboratory
    ): ResponseLaboratory

    laboratory(
      id: Int!
    ): Laboratory


    # ------------------------------------------------------
    # MaterialType
    # ------------------------------------------------------

    materialTypes(
      where: MaterialTypeWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputMaterialType
    ): ResponseMaterialType

    materialType(
      id: Int!
    ): MaterialType


    # ------------------------------------------------------
    # StorageLocation
    # ------------------------------------------------------

    storageLocations(
      where: StorageLocationWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputStorageLocation
    ): ResponseStorageLocation

    storageLocation(
      id: Int!
    ): StorageLocation


    # ------------------------------------------------------
    # User
    # ------------------------------------------------------

    users(
      where: UserWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputUser
    ): ResponseUser

    user(
      id: Int!
    ): User


    # ------------------------------------------------------
    # Sample
    # ------------------------------------------------------

    samples(
      where: SampleWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputSample
    ): ResponseSample

    sample(
      id: Int!
    ): Sample


    # ------------------------------------------------------
    # SampleMovement
    # ------------------------------------------------------

    sampleMovements(
      where: SampleMovementWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputSampleMovement
    ): ResponseSampleMovement

    sampleMovement(
      id: Int!
    ): SampleMovement


    # ------------------------------------------------------
    # Alert
    # ------------------------------------------------------

    alerts(
      where: AlertWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputAlert
    ): ResponseAlert

    alert(
      id: Int!
    ): Alert


    # ------------------------------------------------------
    # UserAlert
    # ------------------------------------------------------

    userAlerts(
      where: UserAlertWhereFilterInput
      search: SearchInput
      take: Int
      skip: Int
      orderBy: OrderByInputUserAlert
    ): ResponseUserAlert

    userAlert(
      id: Int!
    ): UserAlert
  }
`;

export { generalTypes };