import {
  SearchArgs,
  whereFilterType,
} from "../interfaces/transformation";

import { SearchConditionsService } from "./SearchConditionsService";

export class SearchTransformationService {
  private readonly searchTransformer: SearchConditionsService;

  constructor() {
    this.searchTransformer = new SearchConditionsService();
  }

  public getWhereConditions(
    args: whereFilterType,
    search: SearchArgs | undefined,
    enumFields: Record<string, any> | undefined,
    relationStringFilters:
      | Array<{
          entity: string;
          field: string;
        }>
      | undefined
  ) {
    const andConditions = [...(args?.AND || [])];

    if (
      search?.value &&
      (
        search?.columns?.enums ||
        search?.columns?.strings ||
        search?.columns?.numbers ||
        search?.columns?.dates
      )
    ) {
      const enumOrConditions = enumFields
        ? this.searchTransformer.getEnumConditions(
            search.columns?.enums || [],
            search.value,
            enumFields
          )
        : [];

      const stringOrConditions =
        this.searchTransformer.getStringConditions(
          search.columns?.strings || [],
          search.value
        );

      let numberOrConditions: Record<string, unknown>[] = [];

      if (!isNaN(Number(search.value))) {
        numberOrConditions =
          this.searchTransformer.getNumberConditions(
            search.columns?.numbers || [],
            Number(search.value)
          );
      }

      let dateOrConditions: Record<string, unknown>[] = [];

      if (
        !isNaN(new Date(search.value).getTime()) &&
        isNaN(Number(search.value))
      ) {
        dateOrConditions =
          this.searchTransformer.getDateConditions(
            search.columns?.dates || [],
            new Date(search.value)
          );
      }

      const relationOrConditions = relationStringFilters
        ? this.searchTransformer.getRelationStringConditions(
            search.value,
            relationStringFilters
          )
        : [];

      const combinedOrConditions = [
        ...enumOrConditions,
        ...stringOrConditions,
        ...numberOrConditions,
        ...dateOrConditions,
        ...relationOrConditions,
      ];

      if (combinedOrConditions.length > 0) {
        andConditions.push({
          OR: combinedOrConditions,
        });
      }
    }

    const where = {
      AND: andConditions,

      ...(args?.OR && args.OR.length > 0
        ? { OR: args.OR }
        : {}),

      ...(args?.NOT && args.NOT.length > 0
        ? { NOT: args.NOT }
        : {}),
    };

    return where;
  }
}