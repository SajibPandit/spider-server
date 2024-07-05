// Function to generate slug from Bengali and English title
function generateSlug(title) {
  // Replace non-alphanumeric characters except Bengali characters with hyphen
  let slug = title
    .toLowerCase()
    .replace(/[^\u0980-\u09FFa-zA-Z0-9]+/g, '-') // Matches Bengali characters and removes them
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  return slug;
}

module.exports = generateSlug;
