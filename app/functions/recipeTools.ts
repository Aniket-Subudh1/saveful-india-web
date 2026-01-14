import ConnectDb from "@/middlewares/connectDb";
import HackOrTip from "@/models/HackOrTip";
import Recipe from "@/models/Recipe";
import IngredientsCategory from "@/models/IngredientsCategory";
import FrameworkCategory from "@/models/FrameworkCategory";
import Ingredient from "@/models/Ingredient";
//normalize query
function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}
// INGREDIENTS TOOL
export async function executeIngredients(query: string) {
    await ConnectDb();
  const q = normalizeQuery(query);

  if (!q || q.length < 2) return [];

  const results = await Ingredient.find({
    name: { $regex: new RegExp(q, "i") }
  })
  .select("_id name")
  .limit(10)
  .lean();

  return results.map(item => ({
    _id: item._id.toString(),
    name: item.name
  }));
}
// HACKS OR TIPS TOOL
export async function executeHacksOrTips(query: string) {
  const q = normalizeQuery(query);

  if (!q || q.length < 2) return [];

  const results = await HackOrTip.find({
    title: { $regex: new RegExp(q, "i") }
  })
  .select("_id text")
  .limit(10)
  .lean();

  return results.map(item => ({
    _id: item._id.toString(),
    text: item.text
  }));
}
//get framework categories tool
export async function executeFrameworkCategories(query: string) {
  const q = normalizeQuery(query);

  if (!q || q.length < 2) return [];

  const results = await FrameworkCategory.find({
    title: { $regex: new RegExp(q, "i") }
  })
  .select("_id name")
  .limit(10)
  .lean();

  return results.map(item => ({
    _id: item._id.toString(),
    name: item.name
  }));
}
//get recipes tool
export async function executeRecipes(query: string) {
  const q = normalizeQuery(query);

  if (!q || q.length < 2) return [];

  const results = await Recipe.find({
    title: { $regex: new RegExp(q, "i") }
  })
  .select("_id title")
  .limit(10)
  .lean();

  return results.map(item => ({
    _id: item._id.toString(),
    title: item.title
  }));
}
  const getIngredients = async (query: string) => {
    return await executeIngredients(query);
  }

  const getHacksOrTips = async (query: string) => {
    return await executeHacksOrTips(query);
  }
    const getFrameworkCategories = async (query: string) => {
        return await executeFrameworkCategories(query);
    }

    const getRecipes = async (query: string) => {   
        return await executeRecipes(query);
    }
    export {
      getIngredients,
      getHacksOrTips,
      getFrameworkCategories,
      getRecipes
    };