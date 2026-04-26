"use strict";
/**
 * التحقق من حقول التخصيص المرتبطة (linked validation)
 * مثال: إسوارة كبل — الحقلين يجب أن يكونا بنفس الطول
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLinkedFields = validateLinkedFields;
exports.validateAllowedChars = validateAllowedChars;
function validateLinkedFields(value1, value2, rule) {
    const errors = [];
    let suggestion;
    if (rule.type === 'equal_length') {
        if (value1.length !== value2.length) {
            const diff = Math.abs(value1.length - value2.length);
            const fillChar = rule.fill_char || '❤';
            if (value1.length < value2.length) {
                suggestion = value1 + fillChar.repeat(diff);
                errors.push(`Field must be ${value2.length} characters. Add ${diff} "${fillChar}" to match.`);
            }
            else {
                suggestion = value2 + fillChar.repeat(diff);
                errors.push(`Fields must have equal length. Current: ${value1.length} vs ${value2.length}`);
            }
        }
    }
    if (rule.type === 'max_combined') {
        const maxLength = parseInt(rule.target_field_id); // reuse field for max value
        if (value1.length + value2.length > maxLength) {
            errors.push(`Combined length must not exceed ${maxLength}. Current: ${value1.length + value2.length}`);
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        suggestion,
    };
}
function validateAllowedChars(value, allowedPattern) {
    const regex = new RegExp(`^[${allowedPattern}]+$`);
    return regex.test(value);
}
//# sourceMappingURL=custom-field.validator.js.map