import mongoose from "mongoose";
import "dotenv/config";
import { logger } from "./utils/logger.js";

export const mongo = async () => {
	logger.debug(`Database connection opened.`)
	await mongoose.connect(process.env.DB_PATH, { useNewUrlParser: true, useUnifiedTopology: true })
	return mongoose
}