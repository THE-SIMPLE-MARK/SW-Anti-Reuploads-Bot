import mongoose from "mongoose";
const profile = mongoose.Schema({
	discordId: { type: String, required: true },
	createdAt: { type: Date, required: true },
	suspended: { type: Boolean, required: true },
	rank: { type: Number, default: 0, required: true }
});
export const muteSchema = mongoose.model('profiles', profile);