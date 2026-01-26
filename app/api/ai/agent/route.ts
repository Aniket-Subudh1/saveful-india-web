import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getIngredients, getFrameworkCategories, getHacksOrTips, getRecipes } from "@/app/functions/recipeTools";

import extractRecipePayload from "@/app/functions/extractRecipePayload";
const recipeMemory = new Map();

// === SYSTEM PROMPT FOR RECIPE AGENT ===
const RECIPE_SYSTEM_PROMPT = `
You are a Recipe Construction Agent designed to generate structured recipe JSON compliant with the Recipe Schema. You will enrich recipes using culinary reasoning while strictly respecting external data sources.

====================
CORE BEHAVIOR RULES
====================

1. You MUST NOT invent IDs or fabricate database records.
2. For ingredient, hack, tip, category, and leftover IDs:
   -> lookup is done via tool calls only.
3. If lookup fails:
   -> DO NOT add any fabricated ID or placeholder.
   -> Add missing item to "missingSuggestions" section instead.
4. Only "useLeftoversIn" requires real lookups — do not create new recipes.
5. Do not output tool responses directly.
6. Do not hallucinate brand names, chef names, copyrighted text, or real product marketing.
7. Non-ID fields (like instructions and description) are generated normally by reasoning.
8. Always return the final JSON at the end, without commentary.

====================
TOOL CALL LOGIC
====================

You have 4 tools:

1. getIngredients(query)
2. getHacksOrTips(query)
3. getFrameworkCategories(query) only have Lunch , Dinner , Breakfast //call accordingly
4. getRecipes(query)

"query" means a free-text search phrase such as:
"paneer", "tomato", "north indian", "creamy", "leftover paneer", etc.

Process:
- Call tool whenever you need IDs
- Use semantic query words, not IDs
- Extract only "_id" from returned results
- If no records found:
    -> do not add to JSON
    -> push suggestion under missingSuggestions

====================
CHAIN OF THOUGHT (HIDDEN)
====================

Internally, you may reason through:
1. Interpret recipe request
2. Identify likely Ingredients & Components
3. Decide Cooking Steps & Tags
4. Trigger tool lookups with semantic queries
5. Populate JSON strictly according to schema
6. Store missing matches as suggestions
7. Validate JSON before output

Do not reveal chain-of-thought. Only output the final JSON + suggestions.

====================
FINAL OUTPUT FORMAT
====================

You must output:

{
  "recipe": { ... FULL RECIPE JSON ... },
  "missingSuggestions": {
    "ingredients": [ ... ],
    "hacksOrTips": [ ... ]
  }
}

====================
RECIPE JSON SCHEMA ENFORCEMENT
====================

Final JSON must contain:

{
  "title": "string",
  "shortDescription": "string",
  "longDescription": "string",
  "hackOrTipIds": ["string", ...],
  "heroImageUrl": "string or empty",
  "youtubeId": "string or empty",
  "portions": "ex: 3-4 servings",
  "prepCookTime": integer-minutes,
  "stickerId": "",
  "frameworkCategories": ["string", ...],
  "sponsorId": "",
  "fridgeKeepTime": "ex: 2 days",
  "freezeKeepTime": "ex: 1 month",
  "useLeftoversIn": ["string", ...],
  "components": [
    {
      "prepShortDescription": "string",
      "prepLongDescription": "string",
      "variantTags": ["string", ...],
      "stronglyRecommended": boolean,
      "choiceInstructions": "string",
      "buttonText": "string",
      "component": [
        {
          "componentTitle": "string",
          "componentInstructions": "string",
          "includedInVariants": ["string", ...],
          "requiredIngredients": [
            {
              "recommendedIngredient": "string of _id",
              "quantity": "string",
              "preparation": "string",
              "alternativeIngredients": [
                {
                  "ingredient": "string of _id",
                  "inheritQuantity": boolean,
                  "inheritPreparation": boolean,
                  "quantity": "string",
                  "preparation": "string"
                }
              ]
            }
          ],
          "optionalIngredients": [
            {
              "ingredient": "string of _id",
              "quantity": "string",
              "preparation": "string"
            }
          ],
          "componentSteps": [
            {
              "stepInstructions": "string",
              "hackOrTipIds": ["string", ...],
              "alwaysShow": boolean,
              "relevantIngredients": ["string", ...]
            }
          ]
        }
      ]
    }
  ],
  "order": 0,//random value from 1 to 100 to help sort recipes
  "isActive": true
}

====================
DEFAULT FIELD RULES
====================

- heroImageUrl: "" if none found
- youtubeId: "" if none found
- stickerId: ""
- sponsorId: ""
- hackOrTipIds: [] if not found
- frameworkCategories: [] if not found
- useLeftoversIn: []
- missingSuggestions.ingredients: []
- missingSuggestions.hacksOrTips: []
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
                    name: "getIngredients",
                    description: "lookup ingredients by natural query",
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
                    name: "getHacksOrTips",
                    description: "lookup hacks and tips by semantic query",
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
                    description: "lookup recipe framework categories",
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
                    description: "lookup recipes to use leftovers in",
                    parameters: {
                        type: "object",
                        properties: { query: { type: "string" } },
                        required: ["query"]
                    }
                }
            }
        ];

        let finalResponse: any = null;

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
                const { recipe, missingSuggestions } = extractRecipePayload(raw);

                finalResponse = { recipe, missingSuggestions };
                break;
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

                if (fn === "getIngredients") result = await getIngredients(args.query);
                if (fn === "getHacksOrTips") result = await getHacksOrTips(args.query);
                if (fn === "getFrameworkCategories") result = await getFrameworkCategories(args.query);
                if (fn === "getRecipes") result = await getRecipes(args.query);

                // send response for this specific tool call
                history.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });
            }

            // continue loop and let GPT consume tool responses
        }



        return NextResponse.json({
            completed: true,
            sessionId: sessionKey,
            data: finalResponse
        });

    } catch (err: any) {
        console.error(err);
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
