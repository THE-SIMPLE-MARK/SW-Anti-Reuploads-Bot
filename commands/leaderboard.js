export const data = new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("Show the top 10 people with the most activity.")
		.setDefaultPermission(true)

import { SlashCommandBuilder } from "@discordjs/builders";
import { getRandomColor } from "../utils/helpers.js"
import * as Discord from "discord.js";

export const execute = async (client, interaction) => {
	await interaction.deferReply()
    await interaction.editReply("Command doesn't work yet.")
};