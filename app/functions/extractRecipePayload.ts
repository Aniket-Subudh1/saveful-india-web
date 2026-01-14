function extractRecipePayload(raw: string) {
  if (!raw) throw new Error("No recipe payload returned");

  // strip code fences if present
  let cleaned = raw.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();

  // attempt parsing
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse failed:", err, cleaned);
    throw new Error("Recipe JSON returned by model is invalid");
  }

  // Normalize structure
  const recipe = parsed.recipe || parsed.json || parsed.data || parsed;

  const missingSuggestions = parsed.missingSuggestions || {
    ingredients: [],
    hacksOrTips: []
  };

  return { recipe, missingSuggestions };
}
export default extractRecipePayload;