import mongoose from 'mongoose'

const ApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, default: 'Under review' },
  application: { type: mongoose.Schema.Types.Mixed, required: true }, passport: { url: String, publicId: String, fileName: String },
  decisionNote: { type: String, default: '' }, clearanceFee: { type: Number, default: null }, decidedAt: { type: Date, default: null },
}, { timestamps: true })

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema)
