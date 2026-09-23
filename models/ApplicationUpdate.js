import mongoose from 'mongoose'

const ApplicationUpdateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  detail: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true })

ApplicationUpdateSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.ApplicationUpdate || mongoose.model('ApplicationUpdate', ApplicationUpdateSchema)
