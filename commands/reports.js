export const data = new SlashCommandBuilder()
		.setName("reports")
		.setDescription("Show a list of the top 25 reports.")
		.setDefaultPermission(true)

import { SlashCommandBuilder } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import { mongo } from "../mongo.js";
import { profileSchema, reportSchema } from "../schemas.js";
import * as Discord from "discord.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply()
  // open database connection
	await mongo().then(async () => {
		// get all reports
		const reportsData = await reportSchema.find({}).sort({ reportAm: -1 }).limit(25)
		// create embed
		const embed = new Discord.MessageEmbed()
			.setColor("#BCBCBF")
			.setTitle("Top 25 Reports")
			.setDescription("The top 25 reports are sorted by the amount of votes they have.")
			.setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
			.setTimestamp()
		// create buttons and send the embed with them
		reportsData.forEach(report => {
			try {
				const validator = report.originalVehicle.name
				embed.addField(`\`${reportsData.indexOf(report)+1}\`-${report.vehicle.name} by ${report.vehicle.creatorName}`, `[*This vehicle was reported ${report.reporters.length} time(s).*](${report.vehicle.steamUrl})`, false)
			} catch (e) {
				embed.addField(`\`${reportsData.indexOf(report)+1}\`-${report.vehicle.name} by ${report.vehicle.creatorName}`, `[*This vehicle was reported ${report.reporters.length} time(s).*](${report.vehicle.steamUrl})\n__Original vehicle: [${report.originalVehicle.steamUrl}](${report.originalVehicle.steamUrl})__`, false)
			}
		});

		// if there are no reports add a new field
		if (reportsData.length == 0) {
			embed.addField("No reports found", "There are no reports, keep up the good work! :)")
		}
		await interaction.editReply({ embeds: [embed] })
	});
};