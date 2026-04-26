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
export function calculateCommissionPath1(
  basePrice: number,
  platformMarginPercent: number,
  finalPrice: number,
  discountAmount: number = 0,
): CommissionBreakdown {
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
export function calculateCommissionPath2(
  finalPrice: number,
  platformMarginPercent: number,
  discountAmount: number = 0,
): CommissionBreakdown {
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
