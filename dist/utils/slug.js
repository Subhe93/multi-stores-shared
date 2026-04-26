"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.generateUniqueSlug = generateUniqueSlug;
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function generateUniqueSlug(text, existingSlugs) {
    let slug = generateSlug(text);
    if (!existingSlugs.includes(slug))
        return slug;
    let counter = 1;
    while (existingSlugs.includes(`${slug}-${counter}`)) {
        counter++;
    }
    return `${slug}-${counter}`;
}
//# sourceMappingURL=slug.js.map