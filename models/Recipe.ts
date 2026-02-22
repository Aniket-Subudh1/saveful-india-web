import mongoose from 'mongoose';

const AlternativeIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
  },
  inheritQuantity: { type: Boolean, default: false },
  inheritPreparation: { type: Boolean, default: false },
  quantity: { type: String },
  preparation: { type: String },
}, { _id: false });

const RequiredIngredientSchema = new mongoose.Schema({
  recommendedIngredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
  },
  quantity: { type: String, required: true },
  preparation: { type: String, required: true },
  alternativeIngredients: {
    type: [AlternativeIngredientSchema],
    default: [],
  },
}, { _id: false });

const OptionalIngredientSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
  },
  quantity: { type: String, required: true },
  preparation: { type: String, required: true },
}, { _id: false });


const ComponentStepSchema = new mongoose.Schema({
  stepInstructions: { type: String, required: true },
  hackOrTipIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HackOrTip',
    default: [],
  }],
  alwaysShow: { type: Boolean, default: false },
  relevantIngredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    default: [],
  }],
}, { _id: false });

const ComponentSchema = new mongoose.Schema({
  componentTitle: { type: String, required: true },
  componentInstructions: { type: String },
  includedInVariants: { type: [String], default: [] },
  requiredIngredients: { type: [RequiredIngredientSchema], default: [] },
  optionalIngredients: { type: [OptionalIngredientSchema], default: [] },
  componentSteps: { type: [ComponentStepSchema], default: [] },
}, { _id: false });

const RecipeComponentWrapperSchema = new mongoose.Schema({
  prepShortDescription: { type: String },
  prepLongDescription: { type: String },
  variantTags: { type: [String], default: [] },
  stronglyRecommended: { type: Boolean, default: false },
  choiceInstructions: { type: String },
  buttonText: { type: String },
  component: {
    type: [ComponentSchema],
    required: true,
  },
}, { _id: false });


const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  shortDescription: { type: String, required: true },
  longDescription: { type: String, required: true },

  hackOrTipIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HackOrTip',
    default: [],
  }],

  heroImageUrl: { type: String },
  youtubeId: { type: String },

  portions: { type: String, required: true },
  prepCookTime: { type: Number, required: true },

  stickerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stickers',
  },

  frameworkCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackscategory',
    required: true,
    index: true,
  }],

  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsers',
  },

  fridgeKeepTime: { type: String },
  freezeKeepTime: { type: String },

  useLeftoversIn: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: [],
  }],

  components: {
    type: [RecipeComponentWrapperSchema],
    required: true,
  },

  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  countries: { type: [String], default: [] },

}, { timestamps: true });


RecipeSchema.index({ title: 1 });
RecipeSchema.index({ frameworkCategories: 1 });
RecipeSchema.index({ isActive: 1 });
RecipeSchema.index({ order: 1 });

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);
