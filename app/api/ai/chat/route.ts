import { NextResponse,NextRequest} from "next/server";
import ConnectDb from "@/middlewares/connectDb";
import HackOrTip from "@/models/HackOrTip";
import Recipe from "@/models/Recipe";
import IngredientsCategory from "@/models/IngredientsCategory";
import Ingredient from "@/models/Ingredient";
export const GET = async (request: NextRequest) => {
    await ConnectDb();
    const d1 = await Recipe.find({})
    const d2 = await HackOrTip.find({})
    const d3 = await IngredientsCategory.find({})
    const d4 = await Ingredient.find({})

  return NextResponse.json({ message: "AI Chat Endpoint is working!" , data: { recipes: d1, hacksOrTips: d2, ingredientsCategories: d3, ingredients: d4 } }, { status: 200 });
}