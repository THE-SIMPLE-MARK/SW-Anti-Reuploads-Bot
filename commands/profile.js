export const data = new SlashCommandBuilder()
		.setName("profile")
		.setDescription("View your or other's profile.")
		.setDefaultPermission(true)
		.addUserOption(option =>
			option.setName("profile")
			.setDescription("The profile to view. (Leave empty for yours)")
			.setRequired(false))

import { SlashCommandBuilder, time } from "@discordjs/builders";
import { footerIcon } from "../utils/helpers.js"
import * as Discord from "discord.js";
import { mongo } from "../mongo.js";
import { profileSchema, reportSchema } from "../schemas.js";

export const execute = async (client, interaction) => {
	await interaction.deferReply()
  // open database connection
  await mongo().then(async () => {
    // get user's profile
    const user = interaction.options.getUser("profile")
    // get user's profile
    const profile = await profileSchema.findOne({ discordId: user ? user.id : interaction.user.id })
    // get author's profile
    const authorProfile = await profileSchema.findOne({ discordId: interaction.user.id })
    // get all reports
    const reportsData = await reportSchema.find({})

    // check how many reports the user has voted on
    let reportsWithVotes = 0;
    reportsData.forEach(report => {
      if (report.reporters.includes(profile.discordId)) reportsWithVotes++;
    });

    // check how many vehicles the user has reported
    let reports = 0;
    reportsData.forEach(report => {
      console.log(report.reportCreatorId === profile.discordId)
      if (report.reportCreatorId === profile.discordId) reports++
    });

    // create embed
    const embed = new Discord.MessageEmbed()
      .setColor("#BCBCBF")
      .setTitle(`${user ? user.username : interaction.user.username}'s Profile`)
      .setThumbnail(user ? user.avatarURL() : interaction.user.avatarURL())
      .setDescription(`**Rank:** ${profile.rank}\n**Last Active:** ${time(new Date(profile.lastActive))}\n**Created At:** ${time(new Date(profile.createdAt))}`)
      .addField("Reports", reports.toString(), true)
      .addField("Votes", reportsWithVotes.toString(), true)
      .setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
      .setTimestamp()
    // if user is moderator add author to embed
    if (authorProfile.isModerator) embed.setAuthor("Moderator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
    if (authorProfile.isAdmin) embed.setAuthor("Administrator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
    if (authorProfile.suspended) embed.setAuthor("Account suspended", "https://cdn.discordapp.com/attachments/902924492723068969/920402075194654720/Suspended.png")

    // create buttons
    if (profile.suspended && (authorProfile.isModerator || authorProfile.isAdmin) && authorProfile.discordId !== profile.discordId) {
      const row = new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
          .setCustomId('reactivate_account')
          .setLabel('Re-activate Account')
          .setStyle('DANGER')
      )
      await interaction.editReply({ embeds: [embed], components: [row] })
    } else if (!profile.suspended && (authorProfile.isModerator || authorProfile.isAdmin) && authorProfile.discordId !== profile.discordId) {
      const row = new Discord.MessageActionRow()
      .addComponents(
        new Discord.MessageButton()
          .setCustomId('suspend_account')
          .setLabel('Suspend Account')
          .setStyle('DANGER')
      )
      await interaction.editReply({ embeds: [embed], components: [row] })
    } else await interaction.editReply({ embeds: [embed] })

    // create collector for the buttons
		const filter = i => i.user.id === interaction.user.id && !i.user.bot
		const collector = interaction.channel.createMessageComponentCollector({ filter, time: 14000 })

		collector.on('collect', async (i) => {
			if (i.customId === 'suspend_account') {
        // suspend the user
        await profileSchema.updateOne({ discordId: profile.discordId }, { suspended: true })
        // send confirmation
        await i.reply("Account has been successfully suspended.")
      } else if (i.customId === 'reactivate_account') {
        // reactivate the user
        await profileSchema.updateOne({ discordId: profile.discordId }, { suspended: false })
        // send confirmation
        await i.reply("Account has been successfully reactivated.")
      }
    });
  })
};