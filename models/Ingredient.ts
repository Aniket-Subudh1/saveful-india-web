import mongoose from 'mongoose';

export const IngredientTheme = {
  RED: 'Red',
  PINK: 'Pink',
  PURPLE: 'Purple',
  GREEN: 'Green',
  YELLOW: 'Yellow',
  ORANGE: 'Orange',
};

export const Month = {
  JANUARY: 'January',
  FEBRUARY: 'February',
  MARCH: 'March',
  APRIL: 'April',
  MAY: 'May',
  JUNE: 'June',
  JULY: 'July',
  AUGUST: 'August',
  SEPTEMBER: 'September',
  OCTOBER: 'October',
  NOVEMBER: 'November',
  DECEMBER: 'December',
};

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },

  averageWeight: { type: Number, required: true },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IngredientsCategory',
    required: true,
    index: true,
  },

  suitableDiets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietCategory',
    default: [],
  }],

  hasPage: { type: Boolean, default: false },

  heroImageUrl: { type: String },

  theme: {
    type: String,
    enum: Object.values(IngredientTheme),
  },

  parentIngredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    default: [],
  }],

  description: { type: String },

  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsers',
  },

  relatedHacks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HackOrTip',
    default: [],
  }],

  inSeason: [{
    type: String,
    enum: Object.values(Month),
    default: [],
  }],

  stickerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stickers',
  },

  isPantryItem: { type: Boolean, default: false },

  nutrition: { type: String },

  order: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes
IngredientSchema.index({ name: 1 });
IngredientSchema.index({ categoryId: 1 });
IngredientSchema.index({ hasPage: 1 });
IngredientSchema.index({ suitableDiets: 1 });

export default mongoose.models.Ingredient || mongoose.model('Ingredient', IngredientSchema);
