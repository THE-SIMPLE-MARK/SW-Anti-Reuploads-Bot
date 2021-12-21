export const data = new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("Show a list of the top 10 users.")
		.setDefaultPermission(true)

import { SlashCommandBuilder } from "@discordjs/builders";
import { footerIcon, round } from "../utils/helpers.js"
import { mongo } from "../mongo.js";
import { profileSchema } from "../schemas.js";
import * as Discord from "discord.js";
import { logger } from "../utils/logger.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply()
  // open database connection
	await mongo().then(async () => {
		// get all users
		const users = await profileSchema.find({}).sort({ rank: -1 }).limit(10).lean()
		// create embed
		const embed = new Discord.MessageEmbed()
			.setColor("#BCBCBF")
			.setTitle("Top 10 people with the most points")
			.setDescription("The top 10 users sorted by the amount of points they have.")
			.setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
			.setTimestamp()
		// create buttons and send the embed with them
		let index = 1;
		for (const user of users) {
			const userObj = await client.users.fetch(user.discordId)
			embed.addField(`\`${index}\` - ${userObj.username}`, `${round(user.rank)} points.`)
			index++;
		}

		// if there are no reports add a new field
		if (users.length == 0) {
			embed.addField("No users found", "This seems odd, you might want to report this to an administrator.")
			logger.warn(`No users found while running the /leaderboard command; User: ${interaction.user.id}.`)
		}
		await interaction.editReply({ embeds: [embed] })
	});
};