import { NextResponse,NextRequest } from "next/server";
import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export const GET = async (request: NextRequest) => {
    try{
        return NextResponse.json({message: 'Hello from GET method calc route'});
    }
    catch (error) {
        return NextResponse.json({error: 'Internal Server Error'}, {status: 500});
    }
}
export async function POST(request: NextRequest) {
  try {
    const { ingredientName, weightInGrams, country } = await request.json();

    if (!ingredientName || !weightInGrams || !country) {
      return NextResponse.json(
        { error: "ingredientName, weightInGrams, and country are required" },
        { status: 400 }
      );
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant. You will calculate the price of food ingredients based on country and weight that either in english hindi or any language you need to get it based on country what is that in any cases may be typo is there. You MUST respond ONLY in JSON strictly.`
        },
        {
          role: "user",
          content: `
Calculate or estimate the price of the following ingredient based on your knowledge:
- ingredient: ${ingredientName}
- weight: ${weightInGrams} grams
- country: ${country}

Return strictly in JSON with this shape:
{
  "ingredient": "...",
  "weightInGrams": 0,
  "country": "...",
  "priceInINR": 0
}
Convert price to INR always.
`
        }
      ],
      temperature: 0.2
    });

    const aiMessage = response.choices[0].message.content;

    if (!aiMessage) {
      return NextResponse.json(
        { error: "AI returned no content" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...JSON.parse(aiMessage)
    });

  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}