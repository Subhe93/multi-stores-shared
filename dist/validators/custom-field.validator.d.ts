/**
 * التحقق من حقول التخصيص المرتبطة (linked validation)
 * مثال: إسوارة كبل — الحقلين يجب أن يكونا بنفس الطول
 */
export interface LinkedValidationRule {
    type: 'equal_length' | 'max_combined';
    target_field_id: string;
    fill_char?: string;
}
export interface CustomFieldValidationResult {
    valid: boolean;
    errors: string[];
    suggestion?: string;
}
export declare function validateLinkedFields(value1: string, value2: string, rule: LinkedValidationRule): CustomFieldValidationResult;
export declare function validateAllowedChars(value: string, allowedPattern: string): boolean;
//# sourceMappingURL=custom-field.validator.d.ts.map