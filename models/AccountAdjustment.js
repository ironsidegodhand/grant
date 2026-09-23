import mongoose from 'mongoose'

const AccountAdjustmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, min: 0.01, required: true },
  reference: { type: String, trim: true, required: true, maxlength: 160 },
  note: { type: String, trim: true, maxlength: 1000 },
  performedBy: { type: String, default: 'admin' },
}, { timestamps: true })

export default mongoose.models.AccountAdjustment || mongoose.model('AccountAdjustment', AccountAdjustmentSchema)
