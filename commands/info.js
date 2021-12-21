export const data = new SlashCommandBuilder()
		.setName("info")
		.setDescription("Get info about the bot.")
		.setDefaultPermission(true)

import { SlashCommandBuilder, time } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import * as Discord from "discord.js";
import 'dotenv/config';
import { mongo } from "../mongo.js";
import { profileSchema, reportSchema } from "../schemas.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
	await interaction.deferReply({ ephemeral: true })

  const uptime = client.uptime
  // get how many days, hours, minutes, and seconds the bot has been up for
  const days = Math.floor(uptime / 86400000)
  const hours = Math.floor(uptime / 3600000) % 24
  const minutes = Math.floor(uptime / 60000) % 60
  const seconds = Math.floor(uptime / 1000) % 60

  const lastReboot = new Date(Date.now() - uptime)

  // connect to database
  await mongo().then(async () => {
    const profiles = await profileSchema.find({})
      
    // count the amount of profiles not suspended
    const activeProfiles = profiles.filter(profile => !profile.suspended)
    // get the amount of reports
    const reports = await reportSchema.find({})

	  const embed = new Discord.MessageEmbed()
      .setColor("#BCBCBF")
      .setTitle("Stormworks Anti Reuploads")
      .setDescription("Stormworks Anti Reuploads (SWARS for short) was created to stop the overwhelming amount of garbage and re-uploads on the workshop of Stormworks.")
      .addField("Version", "v1.1.0", true)
      .addField("Uptime", `${days}d ${hours}h ${minutes}m ${seconds}s`, true)
      .addField("Last Reboot", time(new Date(lastReboot)), true)
      .addField("Guilds", client.guilds.cache.size.toString(), true)
      .addField("Users", activeProfiles.length.toString(), true)
      .addField("Reports", reports.length.toString(), true)
      .addField("GitHub (Source code)", "[Click here to view the source code.](https://github.com/THE-SIMPLE-MARK/SW-Anti-Reuploads-Bot)", true)
      .addField("Feature Requests & Bug Reports", "Please write those on the [github page](https://github.com/THE-SIMPLE-MARK/SW-Anti-Reuploads-Bot/issues).", true)
      .addField("Invite Link", "[Click here to invite the bot to your server.](https://discord.com/oauth2/authorize?client_id=919957825722126366&permissions=2048&scope=bot%20applications.commands)", true)
      .addField("SM Industries Discord server", "[Click here to join.](https://discord.gg/UGtYxzhHgj)", true)
      .addField("Public Data Spreadsheet","[Click here to view the spreadsheet.](https://docs.google.com/spreadsheets/d/e/2PACX-1vQK4BKQkddFES167oJnKTFtlPZtw0mWzm5mFJzKanjVfUOiBq3qbyJmi9pGj3aGXcNG5hJttlp0MY_E/pubhtml?gid=0&single=true)", true)
      .addField("SWARS Docs", "[Click here to view the docs.](https://simple-mark.gitbook.io/swars/)", true)
      .setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
      .setTimestamp()
    
    await interaction.editReply({ embeds: [embed], ephemeral: true })
  });
};