export interface CommissionBreakdown {
    provider_amount: number;
    platform_amount: number;
    creator_amount: number;
    total: number;
}
/**
 * مسار 1: منتج Provider + تصميم Creator
 * الخصم يتحمله Creator من حصته
 */
export declare function calculateCommissionPath1(basePrice: number, platformMarginPercent: number, finalPrice: number, discountAmount?: number): CommissionBreakdown;
/**
 * مسار 2: منتج Creator فقط (بدون Provider)
 * الخصم يتحمله Creator من حصته
 */
export declare function calculateCommissionPath2(finalPrice: number, platformMarginPercent: number, discountAmount?: number): CommissionBreakdown;
//# sourceMappingURL=price.d.ts.map