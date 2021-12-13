export const data = new SlashCommandBuilder()
		.setName("export")
		.setDescription("Export a specified amount of reuploads into an Excel sheet.")
		.setDefaultPermission(true)
		.addNumberOption(option =>
			option.setName("amount")
			.setDescription("Amount of latest reports to export.")
			.setRequired(true))

import { SlashCommandBuilder } from "@discordjs/builders";
import { getRandomColor } from "../utils/helpers.js"
import * as Discord from "discord.js";

export const execute = async (client, interaction) => {
	await interaction.deferReply()
    await interaction.editReply("Command doesn't work yet.")
};