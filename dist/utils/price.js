"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCommissionPath1 = calculateCommissionPath1;
exports.calculateCommissionPath2 = calculateCommissionPath2;
/**
 * مسار 1: منتج Provider + تصميم Creator
 * الخصم يتحمله Creator من حصته
 */
function calculateCommissionPath1(basePrice, platformMarginPercent, finalPrice, discountAmount = 0) {
    const effectivePrice = finalPrice - discountAmount;
    const platformAmount = Math.round(basePrice * (platformMarginPercent / 100) * 100) / 100;
    const providerAmount = basePrice;
    const creatorAmount = Math.max(0, effectivePrice - providerAmount - platformAmount);
    return {
        provider_amount: providerAmount,
        platform_amount: platformAmount,
        creator_amount: creatorAmount,
        total: effectivePrice,
    };
}
/**
 * مسار 2: منتج Creator فقط (بدون Provider)
 * الخصم يتحمله Creator من حصته
 */
function calculateCommissionPath2(finalPrice, platformMarginPercent, discountAmount = 0) {
    const effectivePrice = finalPrice - discountAmount;
    const platformAmount = Math.round(effectivePrice * (platformMarginPercent / 100) * 100) / 100;
    const creatorAmount = effectivePrice - platformAmount;
    return {
        provider_amount: 0,
        platform_amount: platformAmount,
        creator_amount: creatorAmount,
        total: effectivePrice,
    };
}
//# sourceMappingURL=price.js.map