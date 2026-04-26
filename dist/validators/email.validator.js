"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}
function isValidPassword(password) {
    const errors = [];
    if (password.length < 8)
        errors.push('Password must be at least 8 characters');
    if (password.length > 128)
        errors.push('Password must be at most 128 characters');
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=email.validator.js.map