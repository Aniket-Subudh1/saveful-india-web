import ConnectDb from "@/middlewares/connectDb";
import HackOrTip from "@/models/HackOrTip";
import Recipe from "@/models/Recipe";
import IngredientsCategory from "@/models/IngredientsCategory";
import FrameworkCategory from "@/models/FrameworkCategory";
import Ingredient from "@/models/Ingredient";

// ========================
// HELPERS
// ========================

// Escape special regex characters in user input
function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// normalize query
function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

// Generate plural/singular variants of a word
function wordVariants(word: string): string[] {
  const w = word.toLowerCase();
  const variants = new Set<string>([w]);

  // plural → singular
  if (w.endsWith("ies") && w.length > 4)
    variants.add(w.slice(0, -3) + "y"); // berries → berry
  else if (w.endsWith("ves") && w.length > 4) {
    variants.add(w.slice(0, -3) + "f"); // leaves → leaf
    variants.add(w.slice(0, -3) + "fe"); // knives → knife
  } else if (w.endsWith("ses") || w.endsWith("ches") || w.endsWith("shes"))
    variants.add(w.slice(0, -2)); // sauces → sauce, peaches → peach
  else if (w.endsWith("es") && w.length > 4) variants.add(w.slice(0, -2));
  else if (w.endsWith("s") && w.length > 3) variants.add(w.slice(0, -1));

  // singular → plural
  if (!w.endsWith("s")) {
    variants.add(w + "s");
    if (w.endsWith("y") && w.length > 2)
      variants.add(w.slice(0, -1) + "ies");
  }

  return [...variants];
}

// Common ingredient aliases / synonyms
const INGREDIENT_ALIASES: Record<string, string[]> = {
  capsicum: ["bell pepper", "sweet pepper", "pepper"],
  "bell pepper": ["capsicum", "sweet pepper"],
  cilantro: ["coriander", "coriander leaves", "dhania"],
  coriander: ["cilantro", "coriander leaves", "dhania"],
  eggplant: ["aubergine", "brinjal", "baingan"],
  aubergine: ["eggplant", "brinjal"],
  zucchini: ["courgette"],
  courgette: ["zucchini"],
  scallion: ["spring onion", "green onion"],
  "spring onion": ["scallion", "green onion"],
  "green onion": ["scallion", "spring onion"],
  chickpea: ["garbanzo", "garbanzo bean", "chana"],
  garbanzo: ["chickpea", "chana"],
  arugula: ["rocket", "rocket leaves"],
  rocket: ["arugula"],
  cornstarch: ["corn flour", "cornflour", "corn starch"],
  "corn flour": ["cornstarch", "cornflour"],
  "heavy cream": ["double cream", "whipping cream", "heavy whipping cream"],
  "double cream": ["heavy cream", "whipping cream"],
  prawn: ["shrimp"],
  shrimp: ["prawn"],
  "baking soda": ["bicarbonate of soda", "bicarb"],
  "bicarbonate of soda": ["baking soda"],
  "plain flour": ["all purpose flour", "all-purpose flour", "maida"],
  "all purpose flour": ["plain flour", "all-purpose flour", "maida"],
  paneer: ["cottage cheese", "indian cottage cheese"],
  "cottage cheese": ["paneer"],
  yogurt: ["yoghurt", "curd", "dahi"],
  yoghurt: ["yogurt", "curd"],
  curd: ["yogurt", "yoghurt", "dahi"],
  tomato: ["tamatar"],
  potato: ["aloo"],
  onion: ["pyaaz", "pyaz"],
  garlic: ["lahsun"],
  ginger: ["adrak"],
  turmeric: ["haldi"],
  cumin: ["jeera"],
  chili: ["chilli", "chile"],
  chilli: ["chili", "chile"],
};

// ========================
// RESOLVE CATEGORY (helper)
// ========================
async function resolveCategory(categoryName?: string) {
  if (categoryName) {
    const cat = await IngredientsCategory.findOne({
      name: { $regex: new RegExp(escapeRegex(categoryName.trim()), "i") },
    }).lean();
    if (cat) return cat._id;
  }

  // Find or create default "Uncategorized" category
  let defaultCat: any = await IngredientsCategory.findOne({
    name: "Uncategorized",
  }).lean();
  if (!defaultCat) {
    defaultCat = await IngredientsCategory.create({ name: "Uncategorized" });
  }
  return defaultCat._id;
}

// ================================================================
// GET OR CREATE INGREDIENT — single tool, ALWAYS returns an _id
// ================================================================
// Multi-strategy search: exact → contains → aliases → word fuzzy → create
// ================================================================
export async function executeGetOrCreateIngredient(
  name: string,
  categoryName?: string
) {
  await ConnectDb();

  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { _id: null, name: trimmed, error: "Name too short (min 2 chars)" };
  }

  const queryLower = trimmed.toLowerCase();

  // ── Step 1: Exact match (case-insensitive) ──
  let found: any = await Ingredient.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
  })
    .select("_id name")
    .lean();

  if (found) {
    return { _id: found._id.toString(), name: found.name, created: false };
  }

  // ── Step 2: Contains match (query inside name OR name inside query) ──
  // 2a: query is substring of ingredient name  (e.g. "olive oil" matches "Extra Virgin Olive Oil")
  const containsResults = await Ingredient.find({
    name: { $regex: new RegExp(escapeRegex(trimmed), "i") },
  })
    .select("_id name")
    .limit(5)
    .lean();

  if (containsResults.length > 0) {
    // Pick the shortest name (most specific match)
    const sorted = containsResults.sort(
      (a, b) => a.name.length - b.name.length
    );
    return {
      _id: sorted[0]._id.toString(),
      name: sorted[0].name,
      created: false,
    };
  }

  // 2b: ingredient name is substring of the query  (e.g. query "extra virgin olive oil" matches "Olive Oil")
  // Fetch short-named ingredients and check if query contains them
  const reverseCandidates = await Ingredient.find({})
    .select("_id name")
    .limit(500)
    .lean();

  const reverseMatches = reverseCandidates.filter(
    (r) =>
      r.name.length <= trimmed.length + 3 &&
      queryLower.includes(r.name.toLowerCase())
  );

  if (reverseMatches.length > 0) {
    // Pick the longest matching name (most specific)
    reverseMatches.sort((a, b) => b.name.length - a.name.length);
    return {
      _id: reverseMatches[0]._id.toString(),
      name: reverseMatches[0].name,
      created: false,
    };
  }

  // ── Step 3: Alias / synonym lookup ──
  const aliases = INGREDIENT_ALIASES[queryLower] || [];
  for (const alias of aliases) {
    const aliasResult = await Ingredient.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(alias)}$`, "i") },
    })
      .select("_id name")
      .lean();
    if (aliasResult) {
      return {
        _id: aliasResult._id.toString(),
        name: aliasResult.name,
        created: false,
      };
    }
  }

  // Also try partial alias match (alias as substring of name)
  for (const alias of aliases) {
    const aliasPartial = await Ingredient.findOne({
      name: { $regex: new RegExp(escapeRegex(alias), "i") },
    })
      .select("_id name")
      .lean();
    if (aliasPartial) {
      return {
        _id: aliasPartial._id.toString(),
        name: aliasPartial.name,
        created: false,
      };
    }
  }

  // ── Step 4: Word-by-word fuzzy search with plural handling ──
  const words = trimmed
    .split(/[\s\-_,&+]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2);

  if (words.length > 0) {
    // Generate all word variants (singular/plural)
    const allVariants = words.flatMap((w) => wordVariants(w));
    const uniqueVariants = [...new Set(allVariants)];
    const wordPattern = uniqueVariants.map((v) => escapeRegex(v)).join("|");

    const wordResults = await Ingredient.find({
      name: { $regex: new RegExp(wordPattern, "i") },
    })
      .select("_id name")
      .limit(30)
      .lean();

    if (wordResults.length > 0) {
      // Score each result by relevance
      const scored = wordResults
        .map((r) => {
          const nameLower = r.name.toLowerCase();
          let score = 0;

          // +3 for each query word found in ingredient name
          for (const w of words) {
            const wVariants = wordVariants(w);
            if (wVariants.some((v) => nameLower.includes(v))) score += 3;
          }

          // +2 for each ingredient-name word found in the query
          const nameWords = r.name
            .toLowerCase()
            .split(/[\s\-_,&+]+/)
            .filter((nw: string) => nw.length >= 2);
          for (const nw of nameWords) {
            const nwVariants = wordVariants(nw);
            if (nwVariants.some((v) => queryLower.includes(v))) score += 2;
          }

          // Bonus: name word count similar to query word count → better match
          const wordCountDiff = Math.abs(nameWords.length - words.length);
          score -= wordCountDiff * 0.5;

          // Bonus: shorter length difference → better match
          const lengthDiff = Math.abs(r.name.length - trimmed.length);
          score -= lengthDiff * 0.1;

          return { _id: r._id.toString(), name: r.name, score };
        })
        .sort((a, b) => b.score - a.score);

      // Accept if best score is at least 3 (at least one meaningful word matched)
      if (scored[0].score >= 3) {
        return {
          _id: scored[0]._id,
          name: scored[0].name,
          created: false,
        };
      }
    }
  }

  // ── Step 5: Not found → create it ──
  const categoryId = await resolveCategory(categoryName);

  const newIngredient = await Ingredient.create({
    name: trimmed,
    averageWeight: 100,
    categoryId,
  });

  return {
    _id: newIngredient._id.toString(),
    name: newIngredient.name,
    created: true,
  };
}

// ========================
// SEARCH INGREDIENTS (for backward compat / browsing)
// ========================
export async function executeIngredients(query: string) {
  await ConnectDb();
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];

  const results = await Ingredient.find({
    name: { $regex: new RegExp(escapeRegex(q), "i") },
  })
    .select("_id name")
    .limit(10)
    .lean();

  return results.map((item) => ({
    _id: item._id.toString(),
    name: item.name,
  }));
}

// ========================
// CREATE INGREDIENT (standalone, for backward compat)
// ========================
export async function executeCreateIngredient(
  name: string,
  categoryName?: string
) {
  await ConnectDb();

  const existing = await Ingredient.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
  })
    .select("_id name")
    .lean();

  if (existing) {
    return {
      _id: existing._id.toString(),
      name: existing.name,
      created: false,
    };
  }

  const categoryId = await resolveCategory(categoryName);

  const newIngredient = await Ingredient.create({
    name: name.trim(),
    averageWeight: 100,
    categoryId,
  });

  return {
    _id: newIngredient._id.toString(),
    name: newIngredient.name,
    created: true,
  };
}

// ========================
// HACKS OR TIPS TOOL
// ========================
export async function executeHacksOrTips(query: string) {
  await ConnectDb();
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];

  const results = await HackOrTip.find({
    title: { $regex: new RegExp(escapeRegex(q), "i") },
  })
    .select("_id title shortDescription")
    .limit(10)
    .lean();

  return results.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
    shortDescription: item.shortDescription,
  }));
}

// ========================
// FRAMEWORK CATEGORIES TOOL
// ========================
export async function executeFrameworkCategories(query: string) {
  await ConnectDb();
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];

  const results = await FrameworkCategory.find({
    title: { $regex: new RegExp(escapeRegex(q), "i") },
  })
    .select("_id title")
    .limit(10)
    .lean();

  return results.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
  }));
}

// ========================
// RECIPES TOOL
// ========================
export async function executeRecipes(query: string) {
  await ConnectDb();
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];

  const results = await Recipe.find({
    title: { $regex: new RegExp(escapeRegex(q), "i") },
  })
    .select("_id title")
    .limit(10)
    .lean();

  return results.map((item) => ({
    _id: item._id.toString(),
    title: item.title,
  }));
}

// ========================
// EXPORTED WRAPPERS
// ========================
const getOrCreateIngredient = async (name: string, categoryName?: string) => {
  return await executeGetOrCreateIngredient(name, categoryName);
};

const getIngredients = async (query: string) => {
  return await executeIngredients(query);
};

const getHacksOrTips = async (query: string) => {
  return await executeHacksOrTips(query);
};

const getFrameworkCategories = async (query: string) => {
  return await executeFrameworkCategories(query);
};

const getRecipes = async (query: string) => {
  return await executeRecipes(query);
};

const createIngredient = async (name: string, categoryName?: string) => {
  return await executeCreateIngredient(name, categoryName);
};

export {
  getOrCreateIngredient,
  getIngredients,
  getHacksOrTips,
  getFrameworkCategories,
  getRecipes,
  createIngredient,
};