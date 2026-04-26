export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(text: string, existingSlugs: string[]): string {
  let slug = generateSlug(text);
  if (!existingSlugs.includes(slug)) return slug;

  let counter = 1;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
