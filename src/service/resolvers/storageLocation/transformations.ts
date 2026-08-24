import {
  SearchArgs,
  whereFilterType,
} from "../../utils/interfaces/transformation";

import { SearchTransformationService } from "../../utils/services/SearchTransformationService";

const getWhereInStorageLocations = (
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
    ]
  );
};

export { getWhereInStorageLocations };