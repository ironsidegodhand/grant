import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  deliveredAt: { type: Date, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true })

MessageSchema.index({ user: 1, createdAt: -1 })
MessageSchema.index({ sender: 1, deliveredAt: 1 })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema)
