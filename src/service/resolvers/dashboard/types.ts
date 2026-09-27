import { gql } from "graphql-tag";

const dashboardType = gql`
  # ======================================================
  # DASHBOARD
  # ======================================================

  type Dashboard {
    # Scope
    scope: DashboardScope!
    laboratoryId: Int

    # Samples
    activeSamples: Int!
    samplesCreatedThisMonth: Int!

    # Area / Capacity
    totalAreaCm2: Float!
    usedAreaCm2: Float!
    availableAreaCm2: Float!
    areaUsagePercentage: Float!

    # Alerts
    pendingAlerts: Int!
    criticalAlerts: Int!

    # Movements
    movementsToday: Int!

    # General summary
    laboratoryCount: Int!
    materialTypeCount: Int!

    # Recent activity
    recentActivity: [DashboardActivity!]!
  }

  # ======================================================
  # RECENT ACTIVITY
  # ======================================================

  type DashboardActivity {
    id: ID!
    type: DashboardActivityType!

    title: String!
    description: String!

    createdAt: Date!
  }

  # ======================================================
  # ENUMS
  # ======================================================

  enum DashboardScope {
    ORGANIZATION
    LABORATORY
  }

  enum DashboardActivityType {
    SAMPLE
    MOVEMENT
    ALERT
  }
`;

export { dashboardType };