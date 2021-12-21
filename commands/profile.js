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
import { logger } from "../utils/logger.js";

export const execute = async (client, interaction, isMod, isAdmin) => {
  // return if used outside of guild
  if (!interaction.member) return interaction.reply({
    content: "This command can only be used in a server.",
    ephemeral: true,
  })
	await interaction.deferReply()
  // open database connection
  await mongo().then(async () => {
    // get user's profile
    const user = interaction.options.getUser("profile")
    // get user's profile
    const profile = await profileSchema.findOne({ discordId: user ? user.id : interaction.user.id })
    if (!profile) return await interaction.editReply("That user doesn't have an account yet.")
    // get author's profile
    const authorProfile = await profileSchema.findOne({ discordId: interaction.user.id })
    // get all reports
    const reportsData = await reportSchema.find({})

    const correctUser = user ? user : interaction.user

    // check how many reports the user has voted on
    let reportsWithVotes = 0;
    reportsData.forEach(report => {
      if (report.reporters.includes(profile.discordId)) reportsWithVotes++;
    });

    // check how many vehicles the user has reported
    let reports = 0;
    reportsData.forEach(report => {
      if (report.reportCreatorId === profile.discordId) reports++
    });

    // create embed
    const embed = new Discord.MessageEmbed()
      .setColor("#BCBCBF")
      .setTitle(`${user ? user.username : interaction.user.username}'s Profile`)
      .setThumbnail(user ? user.avatarURL() : interaction.user.avatarURL())
      .setDescription(`**Rank:** ${Math.round(profile.rank * 10) / 10}\n**Last Active:** ${time(new Date(profile.lastActive))}\n**Created At:** ${time(new Date(profile.createdAt))}`)
      .addField("Reports", reports.toString(), true)
      .addField("Votes", reportsWithVotes.toString(), true)
      .setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
      .setTimestamp()
    // if user is moderator add author to embed
    if (profile) {
      if (profile.isModerator) embed.setAuthor("Moderator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
      if (profile.isAdmin) embed.setAuthor("Administrator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
      if (profile.suspended) embed.setAuthor("Account suspended", "https://cdn.discordapp.com/attachments/902924492723068969/920402075194654720/Suspended.png")
    } else {
      if (isMod) embed.setAuthor("Moderator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
      if (isAdmin) embed.setAuthor("Administrator", "https://cdn.discordapp.com/attachments/902924492723068969/920396042539790386/staff_icon.png")
      if (authorProfile.suspended) embed.setAuthor("Account suspended", "https://cdn.discordapp.com/attachments/902924492723068969/920402075194654720/Suspended.png")
    }

    // create buttons and send the embed with them
    let interactionMessage;
    if (profile.suspended && (isMod || isAdmin) && authorProfile.discordId !== profile.discordId) {
      const row = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('reactivate_account')
            .setLabel('Re-activate Account')
            .setStyle('DANGER')
        )
      interactionMessage = await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true })
    } else if (!profile.suspended && (isMod || isAdmin) && authorProfile.discordId !== profile.discordId) {
      const row = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('suspend_account')
            .setLabel('Suspend Account')
            .setStyle('DANGER'),
        )
      interactionMessage = await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true })
    } else if (correctUser.id === interaction.user.id) {
      const row = new Discord.MessageActionRow()
        .addComponents(
          new Discord.MessageButton()
            .setCustomId('delete_account')
            .setLabel('Delete Account')
            .setStyle('DANGER')
        )
      interactionMessage = await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true })
    } else interactionMessage = await interaction.editReply({ embeds: [embed], fetchReply: true })

    // create collector for the buttons
		const filter = i => i.user.id === interaction.user.id
		const collector = interactionMessage.createMessageComponentCollector({ filter, time: 180000, componentType: "BUTTON" }) // 3 minutes

    // fix the collector firing twice after the second time
		let alreadyReplied1 = false;
		let alreadyReplied2 = false;
    let alreadyReplied3 = false;

		collector.on('collect', async (i) => {
      // for some reason some users are able to go through the filter sometimes and press the buttons of other users' => check if the user is the same
      if (i.user.id !== interaction.user.id) return await i.reply({
        content: "You seriously thought I would let you do that?",
        ephermal: true
      })

			if (i.customId === 'suspend_account') {
        // check if the interaction has been already replied to
				if (alreadyReplied1) return;
				alreadyReplied1 = true;

        // suspend the user
        await profileSchema.updateOne({ discordId: profile.discordId }, { suspended: true })
        // send confirmation
        await i.reply("Account has been successfully suspended.")
        logger.info(`${user ? user.id : interaction.user.id}'s account has been suspended by ${interaction.user.id}.`)
      } else if (i.customId === 'reactivate_account') {
        // check if the interaction has been already replied to
				if (alreadyReplied2) return;
				alreadyReplied2 = true;

        // reactivate the user
        await profileSchema.updateOne({ discordId: profile.discordId }, { suspended: false })
        // send confirmation
        await i.reply("Account has been successfully reactivated.")
        logger.info(`${user ? user.id : interaction.user.id}'s account has been reactivated by ${interaction.user.id}.`)
      } else if (i.customId === 'delete_account') {
        // check if the interaction has been already replied to
        if (alreadyReplied3) return;
        alreadyReplied3 = true;

        // delete the user's account
        await profileSchema.deleteOne({ discordId: interaction.user.id })

        // send confirmation
        logger.info(`${interaction.user.id}'s account has been deleted.`)
        return await i.reply({
          content: "Your account has been successfully deleted.",
          ephemeral: true
        })
      }
    });
  })
};