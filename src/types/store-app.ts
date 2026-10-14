import { StoreAppKey } from '../constants/store-apps';

// One StoreApp row: the admin allowlist (available) and the creator's own
// switch (enabled). The app is in effect only when both are true.
export interface IStoreApp {
  id: string;
  store_id: string;
  app_key: StoreAppKey;
  available: boolean;
  enabled: boolean;
  settings: Record<string, unknown>;
  enabled_at?: string | null;
  enabled_by?: string | null;
  created_at: string;
  updated_at: string;
}

// What the public storefront payload carries per enabled app. Apps that are
// not in effect are simply absent, so `{}` means "no apps".
export interface IStorefrontStoreApp {
  enabled: true;
  settings?: Record<string, unknown>;
}

export type StorefrontApps = Partial<Record<StoreAppKey, IStorefrontStoreApp>>;
