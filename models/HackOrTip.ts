import mongoose from 'mongoose';

export const HackOrTipType = {
  PRO_TIP: 'Pro Tip',
  MINI_HACK: 'Mini Hack',
  SERVING_SUGGESTION: 'Serving Suggestion',
};

const HackOrTipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  
  type: {
    type: String,
    required: true,
    enum: Object.values(HackOrTipType),
  },

  shortDescription: { type: String, required: true },

  description: { type: String, required: false },

  sponsorHeading: { type: String },

  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsers',
    required: false,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Indexes
HackOrTipSchema.index({ type: 1 });
HackOrTipSchema.index({ isActive: 1 });

export default mongoose.models.HackOrTip || mongoose.model('HackOrTip', HackOrTipSchema);
