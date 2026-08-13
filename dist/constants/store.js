"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORE_TYPES = void 0;
// Mirrors the Prisma StoreType enum. MARKETPLACE stores sell provider products
// with the platform commission + transfers model; INDEPENDENT stores sell only
// the creator's own products and charge directly on the creator's Stripe account.
exports.STORE_TYPES = ['MARKETPLACE', 'INDEPENDENT'];
//# sourceMappingURL=store.js.map