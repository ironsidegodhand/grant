import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true }, lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true }, passwordHash: { type: String, required: true },
  accountBalance: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
