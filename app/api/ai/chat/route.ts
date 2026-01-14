import { NextResponse,NextRequest} from "next/server";
import ConnectDb from "@/middlewares/connectDb";
import { getRecipes,getFrameworkCategories,getHacksOrTips,getIngredients } from "@/app/functions/recipeTools";
export const GET = async (request: NextRequest) => {
    await ConnectDb();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const d1 = await getRecipes(query);
    const d2 = await getHacksOrTips(query);
    const d3 = await getFrameworkCategories(query);
    const d4 = await getIngredients(query);


  return NextResponse.json({ message: "AI Chat Endpoint is working!" , data: { recipes: d1, hacksOrTips: d2, ingredientsCategories: d3, ingredients: d4 } }, { status: 200 });
}