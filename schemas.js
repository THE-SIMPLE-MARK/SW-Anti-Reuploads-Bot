import mongoose from "mongoose";
const profile = mongoose.Schema({
	discordId: { type: String, required: true },
	createdAt: { type: Date, required: true },
	lastActive: { type: Date, required: true },
	isModerator: { type: Boolean, required: true },
	isAdmin: { type: Boolean, required: true },
	suspended: { type: Boolean, required: true },
	rank: { type: Number, default: 0, required: true }
});
export const profileSchema = mongoose.model('profiles', profile);

const report = mongoose.Schema({
	createdAt: { type: Date, required: true },
	reportCreatorId: { type: String, required: true },
  steamId: { type: String, required: true },
	creatorId: { type: String, required: true },
	vehicle: {
		name: { type: String, required: true },
		steamUrl: { type: String, required: true },
		previewUrl: { type: String, required: true },
		creatorName: { type: String, required: true },
		tags: { type: Array, required: true },
	},
	originalVehicle: {
		name: { type: String, required: false },
		steamUrl: { type: String, required: false },
	},
  reporters: { type: Array, required: true }
});
export const reportSchema = mongoose.model('reports', report);