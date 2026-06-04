export type ProductAlias = {
  value: string;
};

export type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  packageRule?: string;
  aliases: ProductAlias[];
};

export type ParsedOrderLine = {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rawLine: string;
  alias: string;
};

export type ProductParseResult = {
  matched: ParsedOrderLine[];
  unmatched: string[];
};
