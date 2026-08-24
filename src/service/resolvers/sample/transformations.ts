import {
  SearchArgs,
  whereFilterType,
} from "../../utils/interfaces/transformation";

import { SearchTransformationService } from "../../utils/services/SearchTransformationService";

const getWhereInSamples = (
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
        entity: "materialType",
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
    ]
  );
};

export { getWhereInSamples };