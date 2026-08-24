import {
  SearchArgs,
  whereFilterType,
} from "../../utils/interfaces/transformation";

import { SearchTransformationService } from "../../utils/services/SearchTransformationService";

const getWhereInUserAlerts = (
  args: whereFilterType,
  search: SearchArgs | undefined
) => {
  const searchTransformation =
    new SearchTransformationService();

  return searchTransformation.getWhereConditions(
    args,
    search,
    undefined,
    [
      {
        entity: "user",
        field: "fullName",
      },
      {
        entity: "user",
        field: "email",
      },
      {
        entity: "alert",
        field: "message",
      },
      {
        entity: "alert",
        field: "alertType",
      },
      {
        entity: "alert",
        field: "severity",
      },
    ]
  );
};

export { getWhereInUserAlerts };