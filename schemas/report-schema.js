import mongoose from "mongoose";
const report = mongoose.Schema({
	reporterId: { type: String, required: true },
	createdAt: { type: Date, required: true },
    url: { type: String, required: true },
    reportedAm: { type: Number, default: 0, required: true }
});
export const muteSchema = mongoose.model('reports', report);