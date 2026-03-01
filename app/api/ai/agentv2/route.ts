import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import {
  getOrCreateIngredient,
  getFrameworkCategories,
  getHacksOrTips,
  getRecipes,
} from "@/app/functions/recipeTools";

import extractRecipePayload from "@/app/functions/extractRecipePayload";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================
// SYSTEM PROMPT
// ======================

const RECIPE_SYSTEM_PROMPT = `
You are a Recipe Construction Agent designed to generate structured recipe JSON compliant with the Recipe Schema.
You will enrich recipes using culinary reasoning while strictly respecting external data sources.

====================
CRITICAL ID RULES — READ CAREFULLY
====================

- Every ingredient, hack, tip, category, and recipe reference in your JSON MUST be a real MongoDB ObjectId string like "695a9033378ff7d2107e6f35".
- You get these IDs ONLY from tool call responses.
- NEVER use placeholder strings like "ingredient_id_paneer", "category_id_dinner", "" or any invented text.
- NEVER use an empty string "" as an ingredient ID.

====================
INGREDIENT RULE (MOST IMPORTANT)
====================

For EVERY ingredient in the recipe, you MUST call:
   getOrCreateIngredient(name: "Paneer", categoryName: "Dairy")

This tool ALWAYS returns a real MongoDB _id. It searches the database first.
If the ingredient does not exist, it auto-creates it and returns the new _id.
You will NEVER get an empty result. You ALWAYS get back {_id, name}.

Use the returned "_id" value directly in:
  - recommendedIngredient
  - alternativeIngredients[].ingredient
  - optionalIngredients[].ingredient
  - componentSteps[].relevantIngredients[]

Call this tool ONCE for EACH unique ingredient. Do NOT skip any ingredient.
Do NOT reuse the same _id for different ingredients.

====================
CORE BEHAVIOR RULES
====================

1. You MUST NOT invent IDs or fabricate database records.
2. For hacks, tips, categories, and recipes → use the respective lookup tools.
3. If hack/tip or category lookup returns empty:
   -> DO NOT add fabricated IDs.
   -> Add missing item to "missingSuggestions" section.
4. Only "useLeftoversIn" requires recipe lookup.
5. Do not output tool responses directly.
6. Do not hallucinate brand names, chef names, copyrighted text.
7. Your FINAL output must be ONLY raw JSON. No markdown, no code fences, no commentary.

====================
EXTERNAL LINK HANDLING
====================

If the user provides a URL (YouTube, Instagram, website, blog, any recipe webpage):

1. IMMEDIATELY use web_search to search for that EXACT URL and extract the recipe content.
   - For YouTube: search for the exact YouTube URL to find the video title, description, and recipe
   - For Instagram: search for the exact Instagram URL
   - For websites/blogs: search for the exact URL to extract the recipe
2. After web_search returns results, reconstruct the FULL recipe into the JSON schema.
3. Preserve original recipe intent — don't simplify, invent steps, or change cuisine.
4. web_search MUST NOT be used for ID lookups. Only for recipe content extraction.
5. After extracting recipe data → call internal tools (getOrCreateIngredient etc.) for all IDs.
6. If YouTube video → extract youtubeId from URL (the "v=" parameter or youtu.be slug).
7. If web_search fails to find the recipe → try searching for the recipe title + "recipe" as a fallback.
8. NEVER skip the web_search step for URLs — always try to get the actual recipe data first.

====================
TOOLS AVAILABLE
====================

1. getOrCreateIngredient(name, categoryName?)
   → ALWAYS returns {_id, name}. Auto-creates if not in DB.
   → Call ONCE per unique ingredient name.
   → categoryName is optional: "Dairy", "Vegetables", "Spices", "Meat", "Grains", "Oils & Fats", "Herbs", "Condiments", "Fruits", "Nuts & Seeds", etc.

2. getHacksOrTips(query) → returns [{_id, title, shortDescription}]
3. getFrameworkCategories(query) → returns [{_id, title}] (e.g. "Lunch", "Dinner", "Breakfast")
4. getRecipes(query) → returns [{_id, title}] for useLeftoversIn
5. web_search → ONLY for extracting recipe content from URLs

====================
FINAL OUTPUT FORMAT
====================

Output ONLY raw JSON (no markdown, no fences, no text before/after):

{
  "recipe": {
    "title": "string",
    "shortDescription": "string",
    "longDescription": "string",
    "hackOrTipIds": [],
    "heroImageUrl": "",
    "youtubeId": "",
    "portions": "3-4 servings",
    "prepCookTime": 30,
    "stickerId": "",
    "frameworkCategories": [],
    "sponsorId": "",
    "fridgeKeepTime": "2 days",
    "freezeKeepTime": "1 month",
    "useLeftoversIn": [],
    "components": [
      {
        "prepShortDescription": "string",
        "prepLongDescription": "string",
        "variantTags": [],
        "stronglyRecommended": false,
        "choiceInstructions": "string",
        "buttonText": "string",
        "component": [
          {
            "componentTitle": "string",
            "componentInstructions": "string",
            "includedInVariants": [],
            "requiredIngredients": [
              {
                "recommendedIngredient": "REAL_MONGODB_OBJECTID",
                "quantity": "250g",
                "preparation": "cubed",
                "alternativeIngredients": []
              }
            ],
            "optionalIngredients": [],
            "componentSteps": [
              {
                "stepInstructions": "Heat oil in a pan...",
                "hackOrTipIds": [],
                "alwaysShow": true,
                "relevantIngredients": ["REAL_MONGODB_OBJECTID"]
              }
            ]
          }
        ]
      }
    ],
    "order": 42,
    "isActive": true
  },
  "missingSuggestions": {
    "ingredients": [],
    "hacksOrTips": []
  }
}

====================
DEFAULT FIELD RULES
====================

- heroImageUrl: ""
- youtubeId: "" (or video ID from YouTube URL)
- stickerId: ""
- sponsorId: ""
- hackOrTipIds: [] if not found
- frameworkCategories: [] if not found
- useLeftoversIn: []
- order: random 1-100
- isActive: true
- Include minimum 3-4 components in the component array
`;

// ======================
// TOOL DEFINITIONS (Responses API format)
// ======================

const tools: any[] = [
  {
    type: "function",
    name: "getOrCreateIngredient",
    description:
      "Find an ingredient by name in the database. If it does not exist, it auto-creates it. ALWAYS returns {_id, name}. You will never get an empty result. Call this ONCE per unique ingredient.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Exact ingredient name, e.g. 'Paneer', 'Tomato', 'Olive Oil', 'Cumin Seeds'",
        },
        categoryName: {
          type: "string",
          description:
            "Category of the ingredient: 'Dairy', 'Vegetables', 'Spices', 'Meat', 'Grains', 'Oils & Fats', 'Herbs', 'Condiments', 'Fruits', 'Nuts & Seeds', 'Seafood', etc.",
        },
      },
      required: ["name"],
    },
  },
  {
    type: "function",
    name: "getHacksOrTips",
    description:
      "Lookup hacks and tips by semantic query. Returns array of {_id, title, shortDescription}.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search term for hacks or tips",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "getFrameworkCategories",
    description:
      "Lookup recipe framework categories (e.g. Lunch, Dinner, Breakfast). Returns array of {_id, title}.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Category search term like 'lunch', 'dinner', 'breakfast'",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "getRecipes",
    description:
      "Lookup existing recipes for the useLeftoversIn field. Returns array of {_id, title}.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Recipe search term",
        },
      },
      required: ["query"],
    },
  },
  {
    type: "web_search_preview",
    search_context_size: "high",
  },
];

// ======================
// POST ROUTE
// ======================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages[] is required" },
        { status: 400 }
      );
    }

    const sessionKey = sessionId || "default";

    // Build fresh input for this request (same approach as agent v1)
    const input: any[] = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    let finalResponse: any = null;
    const MAX_ITERATIONS = 25;
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(
        `[agentv2] Iteration ${iteration}, input items: ${input.length}`
      );

      const response = await openai.responses.create({
        model: "gpt-4o",
        instructions: RECIPE_SYSTEM_PROMPT,
        input,
        tools,
        tool_choice: "auto",
        max_output_tokens: 16384,
      });

      const output = response.output as any[];
      const outputTypes = output.map((i: any) => i.type).join(", ");
      console.log(`[agentv2] Output types: ${outputTypes}`);

      // Push ALL output items back into input (required by Responses API)
      for (const item of output) {
        input.push(item);
      }

      // Collect function calls and check for web search
      const functionCalls = output.filter(
        (item: any) => item.type === "function_call"
      );
      const hasWebSearch = output.some(
        (item: any) => item.type === "web_search_call"
      );

      // ── If there are function calls, execute them ──
      if (functionCalls.length > 0) {
        for (const fc of functionCalls) {
          const fnName = fc.name;
          let args: any = {};
          try {
            args = JSON.parse(fc.arguments);
          } catch {
            args = {};
          }

          console.log(
            `[agentv2] Tool: ${fnName}(${JSON.stringify(args)})`
          );

          let result: any;
          try {
            switch (fnName) {
              case "getOrCreateIngredient":
                result = await getOrCreateIngredient(
                  args.name,
                  args.categoryName
                );
                break;
              case "getHacksOrTips":
                result = await getHacksOrTips(args.query);
                break;
              case "getFrameworkCategories":
                result = await getFrameworkCategories(args.query);
                break;
              case "getRecipes":
                result = await getRecipes(args.query);
                break;
              default:
                result = { error: `Unknown function: ${fnName}` };
            }
          } catch (err: any) {
            console.error(`[agentv2] Tool ${fnName} error:`, err.message);
            result = { error: `Failed: ${err.message}` };
          }

          console.log(
            `[agentv2] Result: ${JSON.stringify(result).substring(0, 200)}`
          );

          input.push({
            type: "function_call_output",
            call_id: fc.call_id,
            output: JSON.stringify(result),
          });
        }
        // Continue loop — model will consume tool results on next iteration
        continue;
      }

      // ── No function calls — check for final text ──
      let finalText = "";
      for (const item of output) {
        if (item.type === "message") {
          for (const content of item.content || []) {
            if (content.type === "output_text") {
              finalText += content.text;
            }
          }
        }
      }

      if (!finalText.trim()) {
        // Web search happened — model needs another iteration to process results
        if (hasWebSearch) {
          console.log(
            "[agentv2] Web search done, continuing for model to process results..."
          );
          continue;
        }
        // Nothing useful — error
        console.error(
          "[agentv2] Empty output. Types:",
          outputTypes
        );
        throw new Error("Model returned empty response");
      }

      // ── Try to parse the final JSON ──
      try {
        const { recipe, missingSuggestions } =
          extractRecipePayload(finalText);
        finalResponse = { recipe, missingSuggestions };
        break;
      } catch (parseErr: any) {
        console.warn(
          "[agentv2] JSON parse failed, asking model to fix. Raw (first 500):",
          finalText.substring(0, 500)
        );

        // Ask the model to output valid JSON only
        input.push({
          role: "user",
          content:
            "Your previous output was not valid JSON. Please output ONLY the raw JSON object with no markdown code fences, no commentary, and no text before or after the JSON. Start with { and end with }.",
        });
        continue;
      }
    }

    if (!finalResponse) {
      throw new Error("Agent exceeded max iterations without completing");
    }

    return NextResponse.json({
      completed: true,
      sessionId: sessionKey,
      data: finalResponse,
    });
  } catch (err: any) {
    console.error("AgentV2 error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ======================
// DELETE SESSION (kept for backward compat)
// ======================

export async function DELETE() {
  return NextResponse.json({
    success: true,
    message: "Session cleared",
  });
}

export const GET = async () => {
  return NextResponse.json({
    success: true,
    message: "GET method not implemented for this route agentv2",
  });
}