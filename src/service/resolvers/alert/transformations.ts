import {
  SearchArgs,
  whereFilterType,
} from "../../utils/interfaces/transformation";

import { SearchTransformationService } from "../../utils/services/SearchTransformationService";

const getWhereInAlerts = (
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
        entity: "laboratory",
        field: "name",
      },
      {
        entity: "storageLocation",
        field: "name",
      },
      {
        entity: "storageLocation",
        field: "code",
      },
      {
        entity: "sample",
        field: "name",
      },
      {
        entity: "sample",
        field: "code",
      },
    ]
  );
};

export { getWhereInAlerts };