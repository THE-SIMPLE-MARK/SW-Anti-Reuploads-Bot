export const data = new SlashCommandBuilder()
		.setName("export")
		.setDescription("Export a specified amount of reuploads into an Excel sheet.")
		.setDefaultPermission(true)
		.addNumberOption(option =>
			option.setName("amount")
			.setDescription("Amount of latest reports to export.")
			.setRequired(true))

import { SlashCommandBuilder } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import * as Discord from "discord.js";
import { mongo } from "../mongo.js";
import { profileSchema, reportSchema } from "../schemas.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply()

	// open database connection
	await mongo().then(async () => {
		// get all reports sorted by reporters amount
		const amount = interaction.options.getNumber("amount")
		if (amount>100) return await interaction.editReply("Please do not export more than 100 reports at once.")
		const reportsData = await reportSchema.find({}).sort({ reportAm: -1 }).limit(amount).lean()

		// get required data and convert to csv
		const data = [
			{ index: "0", createdAt: "Report Created At", voters: "Votes", steamCreatorId: "Author of vehicle ID", steamCreatorName: "Vehicle author name", vehicleName: "Vehicle name", vehicleUrl: "Vehicle URL", originalVehicleName: "Original Vehicle Name", originalVehicleUrl: "Original Vehicle URL" }
		]

		reportsData.forEach(report => {
			// check if the originalVehicle was provided, if not set it's values to "-"
			try {
				const validator = report.originalVehicle.name
				data.push({ index: reportsData.indexOf(report)+1, createdAt: report.createdAt.toUTCString().replaceAll(',','.'), voters: report.reporters.length, steamCreatorId: report.creatorId, steamCreatorName: report.vehicle.creatorName, vehicleName: report.vehicle.name, vehicleUrl: report.vehicle.steamUrl, originalVehicleName: report.originalVehicle.name, originalVehicleUrl: report.originalVehicle.steamUrl })
			} catch (e) {
				console.log(report.createdAt.toUTCString())
				data.push({ index: reportsData.indexOf(report)+1, createdAt: report.createdAt.toUTCString().replaceAll(',','.'), voters: report.reporters.length, steamCreatorId: report.creatorId, steamCreatorName: report.vehicle.creatorName, vehicleName: report.vehicle.name, vehicleUrl: report.vehicle.steamUrl, originalVehicleName: "-", originalVehicleUrl: "-" })
			}
		});

		const jsonObject = JSON.stringify(data)
		const csv = convertToCSV(jsonObject)

		const date = new Date()
		const dateFull = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`

		const file = new Discord.MessageAttachment(Buffer.from(csv), `reuploads-export-${interaction.user.id}-${dateFull}.csv`)

		// send file
		await interaction.editReply({ files: [file] })
	});
};


function convertToCSV(objArray) {
	const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	let str = '';

	for (let i = 0; i < array.length; i++) {
		let line = '';
		for (const index in array[i]) {
			if (line != '') line += ','

				line += array[i][index];
		}

		str += line + '\r\n';
	}

	return str;
}