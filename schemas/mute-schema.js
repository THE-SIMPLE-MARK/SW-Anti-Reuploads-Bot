import mongoose from "mongoose";
const mute = mongoose.Schema({
	serverId: { type: String, required: true },
	memberId: { type: String, required: true },
	targetId: { type: String, required: true },
	reason: { type: String, required: true },
	createdAt: { type: Date, required: true },
    duration: { type: Number, required: true },
	messageLink: { type: String, required: true }
});
export const muteSchema = mongoose.model('mutes', mute);