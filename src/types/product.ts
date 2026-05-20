import { ProductType, ProductStatus, CustomizationType } from '../constants/product';

export interface IProduct {
  id: string;
  provider_id?: string;
  creator_id?: string;
  category_id: string;
  product_type: ProductType;
  customization_type?: CustomizationType;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string;
  track_inventory: boolean;
  stock_quantity?: number;
  weight?: number;
  weight_unit?: string;
  status: ProductStatus;
  is_featured: boolean;
  created_at: Date;
}

export interface IProductTranslation {
  id: string;
  product_id: string;
  locale: string;
  title: string;
  description: string;
  slug: string;
  meta_title?: string;
  meta_desc?: string;
}

export interface IProductVariant {
  id: string;
  product_id: string;
  sku?: string;
  price_adjustment: number;
  stock_quantity?: number;
  is_active: boolean;
  options: Record<string, string>;
}

export interface ICategory {
  id: string;
  parent_id?: string;
  slug: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  children?: ICategory[];
}

export interface ICategoryTranslation {
  id: string;
  category_id: string;
  locale: string;
  name: string;
  description?: string;
}

export type CreatorCategoryMatchRule = 'MANUAL' | 'TAGS';

export interface ICreatorCategory {
  id: string;
  creator_id: string;
  parent_id?: string | null;
  slug: string;
  thumbnail_url?: string | null;
  match_rule: CreatorCategoryMatchRule;
  match_tags: string[];
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  translations?: ICreatorCategoryTranslation[];
  children?: ICreatorCategory[];
  _count?: { products?: number; children?: number };
}

export interface ICreatorCategoryTranslation {
  id: string;
  creator_category_id: string;
  locale: string;
  name: string;
  description?: string | null;
}
