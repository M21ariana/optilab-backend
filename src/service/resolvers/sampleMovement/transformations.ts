import {
  SearchArgs,
  whereFilterType,
} from "../../utils/interfaces/transformation";

import { SearchTransformationService } from "../../utils/services/SearchTransformationService";

const getWhereInSampleMovements = (
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
        entity: "sample",
        field: "name",
      },
      {
        entity: "sample",
        field: "code",
      },
      {
        entity: "fromLocation",
        field: "name",
      },
      {
        entity: "fromLocation",
        field: "code",
      },
      {
        entity: "toLocation",
        field: "name",
      },
      {
        entity: "toLocation",
        field: "code",
      },
      {
        entity: "performedBy",
        field: "fullName",
      },
    ]
  );
};

export { getWhereInSampleMovements };