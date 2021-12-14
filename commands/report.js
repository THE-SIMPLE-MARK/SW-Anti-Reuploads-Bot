export const data = new SlashCommandBuilder()
		.setName("report")
		.setDescription("Report a Stormworks creation.")
		.setDefaultPermission(true)
		.addStringOption(option =>
			option.setName("url")
			.setDescription("The URL for the creation.")
			.setRequired(true))

import { SlashCommandBuilder, time } from "@discordjs/builders";
import { profileSchema, reportSchema } from "../schemas.js";
import { getRandomColor } from "../utils/helpers.js"
import { mongo } from "../mongo.js";
import * as Discord from "discord.js";
import fetch from 'node-fetch';
import { FormData } from 'formdata-polyfill/esm.min.js';
import 'dotenv/config';

export const execute = async (client, interaction) => {
	await interaction.deferReply()
    // open database connection
    await mongo().then(async () => {
      const url = interaction.options.getString("url")
      // return if input is not at least pretending to be a URL
      if (!url.startsWith("https://steamcommunity.com/sharedfiles/filedetails/?id=")) return await interaction.editReply("The input is not a valid steam URL.")
      const urlId = url.replace(/^\D+/g, "")
			
			// create and append data to a new form
			const form = new FormData();
			form.append('itemcount', 1)
			form.append('publishedfileids[0]', urlId)

			// make the API request to check if the URL is a valid workshop URL and get relevant data
      const response = await fetch(
				`http://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/?key=${process.env.STEAM_API_KEY}`,
				{
          method: 'POST',
					body: form,
          //headers: {'Content-Type': 'application/json'}
      	}
			);

			// check if POST request was successful
      if (!response.ok) return await interaction.editReply("There was an error while trying to process your request.")
			
			// extract data to JSON
      const data = await response.json();
      const vehicleData = data.response.publishedfiledetails[0]

			// double check if request was successful from Steam's side
      if (vehicleData.result !== 1) return await interaction.editReply("The workshop vehicle given was not found.")

			let vehicleTags = "";
			let vehicleTagsArr = [];
			vehicleData.tags.forEach(tag => {
				vehicleTags += `,${tag.tag}`
				vehicleTagsArr.push(tag.tag)
			})
			if (!vehicleTags) vehicleTags = "No tags"

			// check if the name of the vehicle is common amongst reuploaders
			const commonNames = ["Tank","Plane","Heli","Helicopter","Tank","Car","VTOL","House","Building"]
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
				if (vehicleData.description == "") return "[✅] No description."
				if (vehicleData.description != "") return "[❌] Has a description."
			}

			// construct new Discord embed
			const embed = new Discord.MessageEmbed()
				.setColor(getRandomColor())
				.setTitle(vehicleData.title)
				.setURL(vehicleData.url)
				.setDescription(
				`__Reupload Probability:__\n -${checkCommonNames()}\n -${checkEmptyDescription()}`)
				.setThumbnail(vehicleData.preview_url)
				.addField("Steam URL", `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData.publishedfileid}`, true)
				.addField("Tags", vehicleTags, true)
				.addField("Creator", `https://steamcommunity.com/profiles/${vehicleData.creator}`, true)
				.addField("Time Created", time(new Date(vehicleData.time_created)), true)
				.addField("Time Updated", time(new Date(vehicleData.time_updated)), true)

			// create buttons for the user to click on
			const row = new Discord.MessageActionRow()
				.addComponents(
					new Discord.MessageButton()
						.setCustomId('confirm_report')
						.setLabel('Confirm Report')
						.setStyle('DANGER'),
					new Discord.MessageButton()
						.setCustomId('show_creator_profile')
						.setLabel('Show Creator Profile')
						.setStyle('PRIMARY')
				)

			// send the embed to the channel
			await interaction.editReply({ embeds: [embed], components: [row] })

			// create collector for the buttons
			const filter = i => i.user.id === interaction.user.id && !i.user.bot
			const collector = interaction.channel.createMessageComponentCollector({ filter, time: 14000 })
			

			function allocateXP() {
				const xp = Math.floor(Math.random() * 5) + 1
				await profileSchema.updateOne({ userId: interaction.user.id }, { $inc: { xp: xp } })
			}

			collector.on('collect', async (i) => {
				if (i.customId === 'confirm_report') {
					await i.deferReply()

					// create new report
					// check if report already exists and update it if it does update it, otherwise create a new one
					// the reporters array is used to check if the report has already been reported by the user
					// if not the current reporter is added to the array

					const report = await reportSchema.findOne({ url: url })
					if (report) {
						// check if the user has already reported the vehicle
						if (report.reporters.includes(interaction.user.id)) return await i.editReply("You have already reported this vehicle.")
						report.reporters.push(interaction.user.id)
						
						await reportSchema.findOneAndUpdate({ url: url }, { reporters: report.reporters })

						// reply with success message
						await i.editReply("Your report has been updated. As a reward for your contribution, you have been rewarded with some XP.")
					} else {
						const newArray = [interaction.user.id]
						const report = new reportSchema({
							createdAt: new Date(),
							steamId: vehicleData.publishedfileid,
							creatorId: vehicleData.creator,
							vehicle: {
								name: vehicleData.title,
								steamUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${vehicleData.publishedfileid}`,
								previewUrl: vehicleData.preview_url,
								tags: vehicleTagsArr,
							},
							reporters: newArray,
						}).save()

						// reply with success message
						await i.editReply("Your report has been successfully submitted. As a reward for your contribution, you have been rewarded with some XP.")
					}
				} else if (i.customId === 'show_creator_profile') {
					await i.deferReply()

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
					console.log(reports)
					console.log(vehicleNames)

					// combine vehicleNames with vehicleUrls to make hyperlinks
					const vehicleNamesUrls = []
					for (let i = 0; i < vehicleNames.length; i++) {
						vehicleNamesUrls.push(`[${vehicleNames[i]}](${vehicleUrls[i]})`)
					}

					// fetch and extract data from the Steam API
					const creatorData = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${vehicleData.creator}`)
					const creatorDataJson = await creatorData.json()
					
					// check if the request was successful
					if (creatorDataJson.response.players[0].success == false) return await i.editReply("An error occured while fetching the creator's profile.")

					// if the vehicleNamesUrls string is longer than 800 characters, it will be cut down to 800 characters and add a ... at the end
					let vehicleDatas = vehicleNamesUrls.join('\n')
					if (vehicleNamesUrls.length > 800) vehicleNamesUrlsShort = vehicleNamesUrls.join('\n').slice(0, 800) + "..."
					
					// check how many of the creator's vehicles have common names
					let commonNamesAm = 0
					vehicleNames.forEach(name => {
						if (commonNames.includes(name.toLowerCase())) commonNamesCount++
					});

					// check how many of the creator's vehicles have no descriptions
					let noDescriptions = 0
					vehicleDescriptions.forEach(description => {
						if (description == "") noDescriptionsCount++
					});

					// create the embed
					const embed = new Discord.MessageEmbed()
						.setColor(getRandomColor())
						.setTitle(`${creatorDataJson.response.players[0].personaname}'s Profile`)
						.setDescription(`${creatorDataJson.response.players[0].personaname} has uploaded ${vehicleNames.length} vehicle(s).\n- ${(noDescriptions/100)*vehicleDescriptions.length}% of the vehicles have no description.\n- ${(commonNamesAm/100)*vehicleNames.length}% of the vehicles have common names.`)
						.setThumbnail(creatorDataJson.response.players[0].avatarfull)
						.addField('Reported vehicles', `${vehicleDatas}`)
					await i.editReply({ embeds: [embed] })
				}
			});
    });
};