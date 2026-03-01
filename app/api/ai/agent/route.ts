import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import {
  getOrCreateIngredient,
  getFrameworkCategories,
  getHacksOrTips,
  getRecipes,
} from "@/app/functions/recipeTools";

import extractRecipePayload from "@/app/functions/extractRecipePayload";
const recipeMemory = new Map();

// === SYSTEM PROMPT FOR RECIPE AGENT ===
const RECIPE_SYSTEM_PROMPT = `
You are a Recipe Construction Agent designed to generate structured recipe JSON compliant with the Recipe Schema. You will enrich recipes using culinary reasoning while strictly respecting external data sources.

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

If the user provides:
- A YouTube link
- An Instagram link
- Any website URL, blog link, or recipe webpage link

You MUST:

1. Use culinary knowledge and web_search to understand the recipe from the link.
2. Reconstruct the FULL recipe into the required JSON schema.
3. Preserve the original recipe intent exactly as described in the source.
4. After extracting recipe data → call internal tools to fetch valid IDs.
5. If the link is a YouTube video → extract youtubeId from the URL.
6. If scraping fails → fall back to culinary reasoning while respecting all schema rules.

====================
TOOL CALL LOGIC
====================

You have 5 tools:

1. getOrCreateIngredient(name, categoryName?)
   → ALWAYS returns {_id, name}. Auto-creates if not in DB.
   → Call ONCE per unique ingredient name.
   → categoryName: "Dairy", "Vegetables", "Spices", "Meat", "Grains", "Oils & Fats", "Herbs", "Condiments", "Fruits", "Nuts & Seeds", "Seafood", etc.

2. getHacksOrTips(query) → returns [{_id, title, shortDescription}]
3. getFrameworkCategories(query) → returns [{_id, title}] (Lunch, Dinner, Breakfast)
4. getRecipes(query) → returns [{_id, title}] for useLeftoversIn

Call getOrCreateIngredient ONCE for EACH unique ingredient. Do NOT skip any.

====================
FINAL OUTPUT FORMAT
====================

Output ONLY this raw JSON (no markdown fences, no text before/after):

{
  "recipe": {
    "title": "string",
    "shortDescription": "string",
    "longDescription": "string",
    "hackOrTipIds": ["real_objectId_string"],
    "heroImageUrl": "",
    "youtubeId": "",
    "portions": "3-4 servings",
    "prepCookTime": 30,
    "stickerId": "",
    "frameworkCategories": ["real_objectId_string"],
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
                "recommendedIngredient": "real_objectId_from_tool",
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
                "relevantIngredients": ["real_objectId_from_tool"]
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

- heroImageUrl: "" if none found
- youtubeId: "" if none found; extract video ID from YouTube URL if provided
- stickerId: ""
- sponsorId: ""
- hackOrTipIds: [] if not found
- frameworkCategories: [] if not found
- useLeftoversIn: []
- missingSuggestions.ingredients: []
- missingSuggestions.hacksOrTips: []
- Generate a random "order" value between 1-100
- "isActive" always true
- Include minimum 3-4 components in the component array
`;

export const maxDuration = 60; 
export const dynamic = 'force-dynamic'; 


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { messages, sessionId } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "messages[] required" }, { status: 400 });
        }

        const sessionKey = sessionId || "default";
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // we build a dynamic conversation stack for GPT
        let history: any[] = [
            { role: "system", content: RECIPE_SYSTEM_PROMPT },
            ...messages
        ];

        const tools = [
            {
                type: "function" as const,
                function: {
                    name: "getOrCreateIngredient",
                    description: "Find ingredient by name. If not in DB, auto-creates it. ALWAYS returns {_id, name}. Call ONCE per unique ingredient.",
                    parameters: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Exact ingredient name, e.g. 'Paneer', 'Tomato', 'Olive Oil'" },
                            categoryName: { type: "string", description: "Category: 'Dairy', 'Vegetables', 'Spices', 'Meat', 'Grains', 'Oils & Fats', 'Herbs', 'Condiments', etc." }
                        },
                        required: ["name"]
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "getHacksOrTips",
                    description: "Lookup hacks and tips by semantic query. Returns [{_id, title, shortDescription}].",
                    parameters: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "getFrameworkCategories",
                    description: "Lookup framework categories (Lunch, Dinner, Breakfast). Returns [{_id, title}].",
                    parameters: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "getRecipes",
                    description: "Lookup recipes to use leftovers in. Returns [{_id, title}].",
                    parameters: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                    }
                }
            }
        ];

        let finalResponse: any = null;
        const MAX_ITERATIONS = 20;
        let iteration = 0;

        // internal loop — runs until GPT completes
        while (true) {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: history,
                tools,
                tool_choice: "auto"
            });

            const msg = completion.choices[0].message;

            // termination case
            if (!msg.tool_calls) {
                history.push(msg);
                const raw = msg.content || "";

                try {
                    const { recipe, missingSuggestions } = extractRecipePayload(raw);
                    finalResponse = { recipe, missingSuggestions };
                    break;
                } catch (parseErr: any) {
                    console.warn("JSON parse failed, asking model to fix:", parseErr.message);
                    history.push({
                        role: "user",
                        content: "Your previous output was not valid JSON. Please output ONLY the raw JSON object with no markdown code fences, no commentary, and no text before or after the JSON. Start with { and end with }."
                    });
                    continue;
                }
            }

            history.push({
                role: "assistant",
                content: null,
                tool_calls: msg.tool_calls
            });

            // now execute ALL tool calls
            for (const toolCall of msg.tool_calls) {
                if (toolCall.type !== "function") continue;

                const args = JSON.parse(toolCall.function.arguments);
                const fn = toolCall.function.name;

                let result: any = [];

                try {
                    if (fn === "getOrCreateIngredient") result = await getOrCreateIngredient(args.name, args.categoryName);
                    if (fn === "getHacksOrTips") result = await getHacksOrTips(args.query);
                    if (fn === "getFrameworkCategories") result = await getFrameworkCategories(args.query);
                    if (fn === "getRecipes") result = await getRecipes(args.query);
                } catch (err: any) {
                    console.error(`Tool ${fn} error:`, err);
                    result = { error: `Failed to execute ${fn}: ${err.message}` };
                }

                console.log(`[agent] ${fn}(${JSON.stringify(args)}) =>`, JSON.stringify(result).substring(0, 200));

                // send response for this specific tool call
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }

            // continue loop and let GPT consume tool responses
        }

        if (!finalResponse) {
            throw new Error("Agent exceeded max iterations without completing");
        }

        return NextResponse.json({
            completed: true,
            sessionId: sessionKey,
            data: finalResponse
        });

    } catch (err: any) {
        console.error("Agent error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}



export async function DELETE(request: Request) {
    const body = await request.json();
    const { sessionId } = body;

    if (sessionId && recipeMemory.has(sessionId)) {
        recipeMemory.delete(sessionId);
        return NextResponse.json({ success: true, message: "Session cleared" });
    }

    return NextResponse.json({ success: false, message: "Session not found" });
}

export const GET = async () => {
  return NextResponse.json({
    success: true,
    message: "GET method not implemented for this route agent",
  });
}