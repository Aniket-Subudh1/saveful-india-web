import mongoose from 'mongoose';

const IngredientsCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.IngredientsCategory || mongoose.model('IngredientsCategory', IngredientsCategorySchema);
