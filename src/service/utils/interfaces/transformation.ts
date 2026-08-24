export interface SearchColumns {
  enums?: string[];
  strings?: string[];
  numbers?: string[];
  dates?: string[];
}

export interface SearchArgs {
  value?: string;
  columns?: SearchColumns;
}

export type whereFilterType = {
  AND?: Array<Record<string, unknown>>;
  OR?: Array<Record<string, unknown>>;
  NOT?: Array<Record<string, unknown>>;
};