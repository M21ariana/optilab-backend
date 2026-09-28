import { gql } from "graphql-tag";

const reportType = gql`
  # ======================================================
  # REPORT SUMMARY
  # ======================================================

  type ReportsSummary {
    overallOccupancy: Float!
    activeSamples: Int!
    movementsLast30Days: Int!
    criticalAlerts: Int!
  }

  # ======================================================
  # OCCUPANCY BY LOCATION
  # ======================================================

  type ReportOccupancyByLocation {
    locationId: Int!
    code: String!
    name: String!

    usedAreaCm2: Float!
    maxAreaCm2: Float!
    occupancy: Float!
  }

  # ======================================================
  # SAMPLES BY MATERIAL TYPE
  # ======================================================

  type ReportSamplesByMaterialType {
    materialTypeId: Int!
    name: String!
    count: Int!
  }

  # ======================================================
  # MOVEMENT TREND
  # ======================================================

  type ReportMovementTrend {
    date: String!
    count: Int!
  }

  # ======================================================
  # INVENTORY FLOW
  # ======================================================

  type ReportInventoryFlow {
    movementType: String!
    count: Int!
  }

  # ======================================================
  # EXPIRATIONS
  # ======================================================

  type ReportExpiration {
    range: String!
    count: Int!
  }

  # ======================================================
  # CRITICAL LOCATIONS
  # ======================================================

  type ReportCriticalLocation {
    locationId: Int!
    code: String!
    name: String!

    occupancy: Float!
    sampleCount: Int!
  }

  # ======================================================
  # REPORTS DASHBOARD
  # ======================================================

  type ReportsDashboard {
    summary: ReportsSummary!

    occupancyByLocation: [ReportOccupancyByLocation!]!

    samplesByMaterialType: [ReportSamplesByMaterialType!]!

    movementTrend: [ReportMovementTrend!]!

    inventoryFlow: [ReportInventoryFlow!]!

    expirations: [ReportExpiration!]!

    criticalLocations: [ReportCriticalLocation!]!
  }
`;

export { reportType };