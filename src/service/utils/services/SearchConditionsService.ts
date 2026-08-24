export class SearchConditionsService {
  public getEnumConditions = (
    columns: string[],
    searchValue: string,
    enumFields: Record<string, unknown>
  ) => {
    const enumConditions = columns
      .map((field: string) => {
        const enumValues = enumFields[field];

        if (enumValues) {
          const matchedKey = Object.keys(enumValues).find((key) =>
            key.toLowerCase().includes(searchValue.toLowerCase())
          );

          if (matchedKey) {
            return {
              [field]: enumValues[matchedKey as keyof typeof enumValues],
            };
          }
        }

        return null;
      })
      .filter(Boolean);

    return enumConditions;
  };

  public getStringConditions(
    columns: string[],
    searchValue: string | undefined
  ) {
    return columns.map((field: string) => ({
      [field]: {
        contains: searchValue,
        mode: "insensitive",
      },
    }));
  }

  public getNumberConditions(
    columns: string[],
    searchValue: number
  ) {
    return columns.map((field: string) => ({
      [field]: searchValue,
    }));
  }

  public getDateConditions(
    columns: string[],
    searchValue: Date
  ) {
    const startOfDay = new Date(searchValue);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(searchValue);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return columns.map((field: string) => ({
      [field]: {
        gte: startOfDay,
        lte: endOfDay,
      },
    }));
  }

  public getRelationStringConditions = (
    searchValue: string,
    relationStringFilters: Array<{
      entity: string;
      field: string;
    }>
  ) => {
    return relationStringFilters.map(
      (relation: Record<string, string>) => ({
        [relation.entity]: {
          [relation.field]: {
            contains: searchValue,
            mode: "insensitive",
          },
        },
      })
    );
  };
}