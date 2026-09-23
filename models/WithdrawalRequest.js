import mongoose from 'mongoose'

const WithdrawalRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['bank', 'paypal', 'cashapp', 'wire'], required: true },
  destination: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['Under Review', 'Processing', 'Accepted', 'Declined'], default: 'Under Review', index: true },
  processingFee: { type: Number, min: 0, default: null },
  disbursementFee: { type: Number, min: 0, default: null },
  adminNote: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true })

export default mongoose.models.WithdrawalRequest || mongoose.model('WithdrawalRequest', WithdrawalRequestSchema)
