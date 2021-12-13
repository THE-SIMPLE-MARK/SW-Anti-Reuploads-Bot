export const data = new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a Stormworks creation")
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName("url")
			.setDescription("The URL for the creation.")
			.setRequired(true))

import { SlashCommandBuilder } from "@discordjs/builders";
import { getRandomColor } from "../utils/helpers.js"
import * as Discord from "discord.js";

export const execute = async (client, interaction) => {
	await interaction.deferReply()
    await interaction.editReply("Command doesn't work yet.")
};