import mongoose from "mongoose";
import "dotenv/config";

export const mongo = async () => {
	if (process.argv.includes('--debug')) console.log("Database DEBUG >> The was accessed.")
	await mongoose.connect(process.env.DB_PATH, { useNewUrlParser: true, useUnifiedTopology: true })
	return mongoose
}