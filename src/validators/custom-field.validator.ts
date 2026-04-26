/**
 * التحقق من حقول التخصيص المرتبطة (linked validation)
 * مثال: إسوارة كبل — الحقلين يجب أن يكونا بنفس الطول
 */

export interface LinkedValidationRule {
  type: 'equal_length' | 'max_combined';
  target_field_id: string;
  fill_char?: string; // مثلاً "❤"
}

export interface CustomFieldValidationResult {
  valid: boolean;
  errors: string[];
  suggestion?: string; // اقتراح تعبئة تلقائية
}

export function validateLinkedFields(
  value1: string,
  value2: string,
  rule: LinkedValidationRule,
): CustomFieldValidationResult {
  const errors: string[] = [];
  let suggestion: string | undefined;

  if (rule.type === 'equal_length') {
    if (value1.length !== value2.length) {
      const diff = Math.abs(value1.length - value2.length);
      const fillChar = rule.fill_char || '❤';

      if (value1.length < value2.length) {
        suggestion = value1 + fillChar.repeat(diff);
        errors.push(
          `Field must be ${value2.length} characters. Add ${diff} "${fillChar}" to match.`,
        );
      } else {
        suggestion = value2 + fillChar.repeat(diff);
        errors.push(
          `Fields must have equal length. Current: ${value1.length} vs ${value2.length}`,
        );
      }
    }
  }

  if (rule.type === 'max_combined') {
    const maxLength = parseInt(rule.target_field_id); // reuse field for max value
    if (value1.length + value2.length > maxLength) {
      errors.push(
        `Combined length must not exceed ${maxLength}. Current: ${value1.length + value2.length}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestion,
  };
}

export function validateAllowedChars(
  value: string,
  allowedPattern: string,
): boolean {
  const regex = new RegExp(`^[${allowedPattern}]+$`);
  return regex.test(value);
}
