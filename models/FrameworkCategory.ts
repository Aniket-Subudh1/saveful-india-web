import mongoose from 'mongoose';

const FrameworkCategorySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },

  description: { type: String },

  order: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Indexes
FrameworkCategorySchema.index({ title: 1 });
FrameworkCategorySchema.index({ isActive: 1 });
FrameworkCategorySchema.index({ order: 1 });

export default mongoose.models.FrameworkCategory || mongoose.model('FrameworkCategory', FrameworkCategorySchema);
