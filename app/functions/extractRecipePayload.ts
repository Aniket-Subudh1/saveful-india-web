function extractRecipePayload(raw: string) {
  if (!raw) throw new Error("No recipe payload returned");

  let cleaned = raw.trim();

  // ── Strategy 1: Strip markdown code fences ──
  // Handle ```json ... ``` or ``` ... ``` anywhere in the string
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // ── Strategy 2: Extract the outermost { ... } JSON object ──
  // If the text has commentary around the JSON, find the actual JSON block
  if (!cleaned.startsWith("{")) {
    const firstBrace = cleaned.indexOf("{");
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    }
  }

  // Trim anything after the last closing brace
  if (cleaned.includes("}")) {
    const lastBrace = cleaned.lastIndexOf("}");
    cleaned = cleaned.substring(0, lastBrace + 1);
  }

  // ── Strategy 3: Fix common JSON issues from LLMs ──
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  // Remove single-line comments (// ...)
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");

  // ── Attempt parsing ──
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // ── Strategy 4: Try to fix unescaped newlines in strings ──
    try {
      const fixed = cleaned
        .replace(/[\r\n]+/g, " ")
        .replace(/\s+/g, " ");
      parsed = JSON.parse(fixed);
    } catch (err2) {
      console.error("JSON parse failed after all strategies:");
      console.error("Original raw (first 2000 chars):", raw.substring(0, 2000));
      console.error("Cleaned (first 2000 chars):", cleaned.substring(0, 2000));
      throw new Error("Recipe JSON returned by model is invalid");
    }
  }

  // ── Normalize structure ──
  const recipe = parsed.recipe || parsed.json || parsed.data || parsed;

  const missingSuggestions = parsed.missingSuggestions || {
    ingredients: [],
    hacksOrTips: [],
  };

  return { recipe, missingSuggestions };
}

export default extractRecipePayload;