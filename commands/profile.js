export const data = new SlashCommandBuilder()
		.setName("profile")
		.setDescription("View your or other's profile.")
		.setDefaultPermission(true)
		.addUserOption(option =>
			option.setName("profile")
			.setDescription("The profile to view. (Leave empty for yours)")
			.setRequired(false))

import { SlashCommandBuilder } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import * as Discord from "discord.js";

export const execute = async (client, interaction) => {
	await interaction.deferReply()
  await interaction.editReply("Command doesn't work yet.")
};