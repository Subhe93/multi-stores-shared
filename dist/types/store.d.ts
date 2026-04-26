export interface IStore {
    id: string;
    creator_id: string;
    slug: string;
    custom_domain?: string;
    name: string;
    description?: string;
    logo_url?: string;
    favicon_url?: string;
    theme_config: Record<string, unknown>;
    is_active: boolean;
}
export interface IStoreLanguageConfig {
    id: string;
    store_id: string;
    primary_locale: string;
    secondary_locales: string[];
    auto_translate: boolean;
    fallback_locale: string;
}
//# sourceMappingURL=store.d.ts.map