export const data = new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a Stormworks creation.")
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName("report_url")
			.setDescription("The URL for the creation to report.")
			.setRequired(true))
		.addStringOption(option =>
			option.setName("original_url")
			.setDescription("The URL for the original creation.")
			.setRequired(false))

import { SlashCommandBuilder, time } from "@discordjs/builders";
import { profileSchema, reportSchema } from "../schemas.js";
import { footerIcon, allocateXP } from "../utils/helpers.js"
import { mongo } from "../mongo.js";
import * as Discord from "discord.js";
import fetch from 'node-fetch';
import { FormData } from 'formdata-polyfill/esm.min.js';
import 'dotenv/config';

const commonNames = [
	"plane", "heli",
	"helicopter", "tank",
	"car", "vtol",
	"house", "building",
	"boat", "ship",
	"truck", "sub",
	"submarine", "rocket",
	"spacecraft", "spaceship",
	"base", "microcontroller","tank","test","fly"];

export const execute = async (client, interaction, isMod, isAdmin) => {
    // open database connection
    await mongo().then(async () => {
      const url = interaction.options.getString("report_url");
			const originalUrl = interaction.options.getString("original_url");

      // return if input is not at least pretending to be a URL
      if (!url.startsWith("https://steamcommunity.com/sharedfiles/filedetails/?id=")) return await interaction.reply("The input is not a valid steam URL.")
			const urlId = url.replace(/\D+/g, "")
			
			// create and append data to a new form
			const form = new FormData();
			
			form.append('publishedfileids[0]', urlId)

			// return if input is not at least pretending to be a URL
			if (originalUrl) {
				if (!originalUrl.startsWith("https://steamcommunity.com/sharedfiles/filedetails/?id=")) return await interaction.reply("The input is not a valid steam URL.")
				const originalUrlId = originalUrl.replace(/^\D+/g, "")
				form.append('publishedfileids[1]', originalUrlId)
				form.append('itemcount', 2)
			} else {
				form.append('itemcount', 1)
			}

			// fetch and extract data from the steam API
      const response = await fetch(
				`http://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/?key=${process.env.STEAM_API_KEY}`,
				{
          method: 'POST',
					body: form,
      	}
			);
			// check if POST request was successful
      if (!response.ok) return await interaction.reply("An error occured while fetching the vehicle's details.")
			
			// extract data to JSON
      const data = await response.json();
      const vehicleData = data.response.publishedfiledetails[0];
			let vehicleData2 = undefined;
			if (originalUrl) {
				vehicleData2 = data.response.publishedfiledetails[1];
			}

			// double check if request was successful from Steam's side
      if (vehicleData.result !== 1) return await interaction.reply("The workshop vehicle given was not found.")
			if (originalUrl) {
				if (vehicleData2.result !== 1) return await interaction.reply("The original workshop vehicle given was not found.")
			}

			let vehicleTags = "";
			let vehicleTagsArr = [];
			vehicleData.tags.forEach(tag => {
				vehicleTags += `,${tag.tag}`
				vehicleTagsArr.push(tag.tag)
			})
			// remove first comma
			vehicleTags = vehicleTags.substring(1)
			if (!vehicleTags) vehicleTags = "No tags"

			// check if the name of the vehicle is common amongst reuploaders
			function checkCommonNames() {
				let output = false;
				commonNames.forEach(name => {
					if (vehicleData.title.toLowerCase() == name.toLocaleLowerCase()) output = true;
				})
				if (output == false) return "[❌] Name is not common."
				if (output == true) return "[✅] Name is common amongst reuploaders."
			}
			// check if the description of the vehicle is empty
			function checkEmptyDescription() {
				if (vehicleData.description == "" || vehicleData.description == "This vehicle does not have a description yet.") return "[✅] No description."
				if (vehicleData.description != "" || vehicleData.description !== "This vehicle does not have a description yet.") return "[❌] Has a description."
			}

			// fetch and extract data from the Steam API
			const creatorData = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${vehicleData.creator}`)
			const creatorDataJson = await creatorData.json()
			
			// check if the request was successful
			if (creatorDataJson.response.players[0].success == false) return await i.reply("An error occured while fetching the creator's profile.")

			// construct new Discord embed
			const embed = new Discord.MessageEmbed()
				.setAuthor(creatorDataJson.response.players[0].personaname, creatorDataJson.response.players[0].avatarfull, `https://steamcommunity.com/profiles/${vehicleData.creator}`)
				.setColor("#BCBCBF")
				.setTitle(vehicleData.title, `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData.publishedfileid}`)
				.setURL(vehicleData.url)
				.setDescription(
				`__Reupload Probability:__\n -${checkCommonNames()}\n -${checkEmptyDescription()}`)
				.setThumbnail(vehicleData.preview_url)
				.addField("Tags", vehicleTags, true)
				.addField("Time Created", time(new Date(vehicleData.time_created*1000)), true)
				.addField("Time Updated", time(new Date(vehicleData.time_updated*1000)), true)
				.setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
				.setTimestamp()
			
			if (originalUrl) embed.addField("Original Vehicle", `${vehicleData2.title}\nhttps://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData2.publishedfileid}`, true)

			// add a field if the report has a document
			const report = await reportSchema.findOne({ steamId: vehicleData.publishedfileid })
			if (report) {
				if (report.reporters.length>0) {
					embed.addField("Reported", `${report.reporters.length} time(s)`, true)
				}
			}

			// create buttons for the user to click on
			const row = new Discord.MessageActionRow()
				.addComponents(
					new Discord.MessageButton()
						.setCustomId('confirm_report')
						.setLabel('Confirm Report')
						.setStyle('SUCCESS'),
					new Discord.MessageButton()
						.setCustomId('show_creator_profile')
						.setLabel('Show Creator Profile')
						.setStyle('PRIMARY')
				)
				// button for admins and moderators to delete the report if it's already created
				if (isAdmin || isMod) row.addComponents(
					new Discord.MessageButton()
						.setCustomId('delete_report')
						.setLabel('Delete Report')
						.setStyle('DANGER')
				)

			// send the embed to the channel
			await interaction.reply({ embeds: [embed], components: [row] })

			// create collector for the buttons
			const filter = i => i.user.id === interaction.user.id && !i.user.bot
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 1800000 }) // 30 minutes

			collector.on('collect', async (i) => {
				console.log("button pressed")
				// for some reason some users are able to go through the filter sometimes and press the buttons of other users' => check if the user is the same
				if (i.user.id !== interaction.user.id) return await i.reply("You seriously thought I would let you do that?")

				if (i.customId === 'confirm_report') {
					console.log("confirm report")

					// create new report
					// check if report already exists and update it if it does update it, otherwise create a new one
					// the reporters array is used to check if the report has already been reported by the user
					// if not the current reporter is added to the array

					const report = await reportSchema.findOne({ steamId: urlId })
					if (report) {
						// check if the user has already reported the vehicle
						if (report.reporters.includes(interaction.user.id)) return await i.reply("You have already reported this vehicle.")
						console.log("report exists")
						report.reporters.push(interaction.user.id)
						
						// count the vote
						await reportSchema.findOneAndUpdate({ steamId: urlId }, { reporters: report.reporters, reportAm: report.reportAm+1 })

						// reply with success message
						allocateXP(i)
						await i.reply("Your report has been successfully submitted. As a reward for your contribution, you have been rewarded with some XP.")
					} else {
						console.log("report does not exist")
						const newArray = [interaction.user.id]

						// don't send the originalVehicle data if it doesn't exist
						if (originalUrl) {
							const report = new reportSchema({
								createdAt: new Date(),
								reportCreatorId: interaction.user.id,
								steamId: vehicleData.publishedfileid,
								creatorId: vehicleData.creator,
								vehicle: {
									name: vehicleData.title,
									steamUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData.publishedfileid}`,
									previewUrl: vehicleData.preview_url,
									creatorName: creatorDataJson.response.players[0].personaname,
									tags: vehicleTagsArr,
								},
								originalVehicle: {
									name: vehicleData2.title,
									steamUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData2.publishedfileid}`,
								},
								reporters: newArray,
								reportAm: 1
							}).save()
						} else {
							const report = new reportSchema({
								createdAt: new Date(),
								reportCreatorId: interaction.user.id,
								steamId: vehicleData.publishedfileid,
								creatorId: vehicleData.creator,
								vehicle: {
									name: vehicleData.title,
									steamUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData.publishedfileid}`,
									previewUrl: vehicleData.preview_url,
									creatorName: creatorDataJson.response.players[0].personaname,
									tags: vehicleTagsArr,
								},
								originalVehicle: {
									name: undefined,
									steamUrl: undefined,
								},
								reporters: newArray,
								reportAm: 1,
							}).save()
						}

						// reply with success message
						allocateXP(i)
						await i.reply("Your report has been successfully submitted. As a reward for your contribution, you have been rewarded with some XP.")
					}
				} else if (i.customId === 'show_creator_profile') {

					// get all reported vehicles from the creator
					const reports = await reportSchema.find({ creatorId: vehicleData.creator })

					// collect all data from the creator
					const vehicleNames = []
					const vehicleDescriptions = []
					const vehicleUrls = []
					reports.forEach(report => {
						vehicleNames.push(report.vehicle.name)
						vehicleDescriptions.push(report.vehicle.description)
						vehicleUrls.push(report.vehicle.steamUrl)
					})

					// combine vehicleNames with vehicleUrls to make hyperlinks
					const vehicleNamesUrls = []
					for (let i = 0; i < vehicleNames.length; i++) {
						vehicleNamesUrls.push(`[${vehicleNames[i]}](${vehicleUrls[i]})`)
					}

					// if the vehicleNamesUrls string is longer than 800 characters, it will be cut down to 800 characters and add a ... at the end
					let vehicleDatas = vehicleNamesUrls.join('\n')
					if (vehicleNamesUrls.length > 800) vehicleNamesUrlsShort = vehicleNamesUrls.join('\n').slice(0, 800) + "..."
					
					// check how many of the creator's vehicles have common names
					let commonNamesAm = 0
					vehicleNames.forEach(name => {
						if (commonNames.includes(name.toLowerCase())) commonNamesAm++
					});

					// check how many of the creator's vehicles have no descriptions
					let noDescriptions = 0
					vehicleDescriptions.forEach(description => {
						if (description == "" || description == "This vehicle does not have a description yet.") noDescriptions++
					});
					const vehicleDescriptionsPercent = Math.round((vehicleDescriptions.length - noDescriptions) / vehicleDescriptions.length * 100)
					const commonNamesPercent = Math.round(commonNamesAm / vehicleNames.length * 100)

					// create the embed
					const embed = new Discord.MessageEmbed()
						.setColor("#BCBCBF")
						.setTitle(`${creatorDataJson.response.players[0].personaname}'s Profile`)
						.setDescription(`${creatorDataJson.response.players[0].personaname} has ${vehicleNames.length} flagged vehicle(s).\n- ${vehicleDescriptionsPercent}% of the vehicles have no description.\n- ${commonNamesPercent}% of the vehicles have common names.`)
						.setThumbnail(creatorDataJson.response.players[0].avatarfull)
						.addField('Reported vehicles', `${vehicleDatas}`)
						.setFooter("Stormworks Anti Reuploads | Designed by SM Industries", footerIcon())
						.setTimestamp()
					await i.reply({ embeds: [embed] })
				} else if (i.customId === 'delete_report') {

					// delete the report if it exists
					const report = await reportSchema.findOne({ steamId: vehicleData.publishedfileid });
					if (report) {
						await reportSchema.findOneAndDelete({ steamId: urlId });
						await i.reply("The report has been successfully deleted.")
					} else {
						await i.reply("There is no report to delete for this vehicle.")
					}
				}
			});
    });
};