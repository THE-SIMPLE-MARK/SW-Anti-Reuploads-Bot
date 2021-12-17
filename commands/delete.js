export const data = new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Delete a report from the database.")
		.setDefaultPermission(true)
    .addStringOption(option =>
      option.setName("id")
      .setDescription("The ID of the report to delete.")
      .setRequired(true))

import { SlashCommandBuilder, time } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import * as Discord from "discord.js";
import 'dotenv/config';
import { mongo } from "../mongo.js";
import { profileSchema, reportSchema } from "../schemas.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply()
  
  // check if user is mod or admin
  if (!isMod && !isAdmin) return await interaction.editReply({
    content: "You are not allowed to use this command.",
    ephemeral: true,
  })

  const id = interaction.options.getString("id")

  // open database connection
  await mongo().then(async () => {
    // get report
    const report = await reportSchema.findOne({ _id: id }).lean()
    if (!report) return await interaction.editReply({
      content: "The report provided does not exist.",
			ephemeral: true,
    })

    // delete report
    await reportSchema.deleteOne({ _id: id })

    // send message
    await interaction.editReply({
      content: `Report \`#${report._id}\` has been deleted.`,
    })
  });
};