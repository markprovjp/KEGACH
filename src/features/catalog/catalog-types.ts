export type ProductAlias = {
  value: string;
};

export type ProductVariant = {
  code: string;
  cartonCount: number;
  tubeCount: number;
  note?: string;
};

export type CatalogProduct = {
  id: string;
  sku?: string;
  name: string;
  unit: string;
  defaultPrice: number;
  packageRule?: string;
  imageUrl?: string;
  weightPerUnitKg?: number;
  aliases: ProductAlias[];
  variants?: ProductVariant[];
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
