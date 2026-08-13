// Mirrors the Prisma StoreType enum. MARKETPLACE stores sell provider products
// with the platform commission + transfers model; INDEPENDENT stores sell only
// the creator's own products and charge directly on the creator's Stripe account.
export const STORE_TYPES = ['MARKETPLACE', 'INDEPENDENT'] as const;

export type StoreType = (typeof STORE_TYPES)[number];
