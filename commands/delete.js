export const data = new SlashCommandBuilder()
		.setName("delete")
		.setDescription("Delete a report from the database.")
		.setDefaultPermission(true)
    .addStringOption(option =>
      option.setName("id")
      .setDescription("The ID of the report to delete.")
      .setRequired(true))

import { SlashCommandBuilder } from "@discordjs/builders";
import { updateSheetData } from "../utils/helpers.js"
import 'dotenv/config';
import { mongo } from "../mongo.js";
import { reportSchema } from "../schemas.js";
import { logger } from "../utils/logger.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply({ ephemeral: true });
  
  // check if user is admin
  if (!isAdmin) return await interaction.editReply({
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
      ephemeral: true,
    })
    updateSheetData()
    logger.info(`Report #${report._id} has been deleted by ${interaction.id}.`)
  });
};