const mongoose = require('mongoose');
const Plan = require('../models/plan');

const planSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['plan', 'quiz', 'explanation'],
      default: 'plan',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      trim: true,
    },
    goals: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

planSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Plan', planSchema);
