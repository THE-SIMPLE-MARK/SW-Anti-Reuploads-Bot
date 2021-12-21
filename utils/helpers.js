import * as Discord from 'discord.js';
import { profileSchema, reportSchema } from '../schemas.js';
import { mongo } from '../mongo.js';
import { google } from 'googleapis';
import "dotenv/config";
import privateKey from '../gapi_privatekey.json';
import { logger } from './logger.js';

/**
 * @returns {string} Footer icon.
 */
export function footerIcon() {
  return 'https://cdn.discordapp.com/attachments/902924492723068969/920358262887546931/sm_logo_transparent.png';
}

/**
 * @param {object} guild The guild object
 * @param {string} mention The mention to validate
 */

export function getRole(guild, mention) {
  try {
    if (!mention) return;

    if (mention.startsWith('<@&') && mention.endsWith('>')) {
      mention = mention.slice(3, -1)
    }

    const role = guild.roles.cache.get(mention) || guild.roles.cache.find(role => role.name === mention)
    return role
  }
  catch(e) {
    return undefined;
  }
}

/**
 * @param {object} guild The guild object
 * @param {string} mention The mention to validate
 */

export function getMember(guild, mention) {
  try {
    if (!mention) return;
		
    if (mention.startsWith('<@') && mention.endsWith('>')) {
      mention = mention.slice(2, -1)

      if (mention.startsWith('!')) {
        mention = mention.slice(1)
      }
    }

    const member = guild.members.cache.get(mention) || guild.members.cache.find(member => member.user.tag === mention)
    return member;
  }
  catch(e) {
    return undefined;
  }
}

/**
 * @param {object} guild The guild object
 * @param {string} mention The argument or string to validate
 */

export function getChannel(guild, mention) {
  try {
    if (!mention) return;
		
    if (mention.startsWith('<#') && mention.endsWith('>')) {
      mention = mention.slice(2, -1)
    }
    const channel = guild.channels.cache.get(mention) || guild.channels.cache.find((ch) => ch.name === mention)
    return channel;
  }
  catch(e) {
    return undefined;
  }
}

/**
 * @param {number} value The number to round
 * @param {number} precision The number of decimals to round to
 */

export function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0)
  return Math.round(value * multiplier) / multiplier;
}

/**
 * @param {object} interaction The interaction object
 */

export async function allocateXP(interaction) {
	const xp = round(Math.random(), 1)
	await profileSchema.updateOne({ discordId: interaction.user.id }, { $inc: { rank: xp } })
  logger.info(`${interaction.user.id} has been given ${xp} XP.`)
}

/**
 * @param {string} steamId The original vehicle's ID on the report
 */
export async function pushSheetData(steamId) {
  // connect to google sheet
  const sheets = google.sheets({ 
    version: 'v4',
    auth: process.env.GOOGLE_API_KEY
  })

  // open a database connection
  await mongo().then(async () => {
    // get the report from the database
    const report = await reportSchema.findOne({ steamId: steamId });

    // configure a new JWT auth client
    const jwtClient = new google.auth.JWT(
      privateKey.client_email,
      null,
      privateKey.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    )

    // authenticate request
    jwtClient.authorize(async (err, tokens) => {
      if (err) {
        logger.error(`Google sheets authorization error: ${err}`);
        return;
      }
    })

    // read the sheet and get the current index
    const response = await sheets.spreadsheets.values.get({
      auth: jwtClient,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Sheet1'"
    })

    let originalVehicleUrl = "-";
    let originalVehicleName = "-";
    if (report.originalVehicle.name) {
      originalVehicleName = report.originalVehicle.name;
      originalVehicleUrl = report.originalVehicle.steamUrl;
    }

    let index = 1;
    if (response.data.values) index = response.data.values.length;

    // push the data to the sheet
    sheets.spreadsheets.values.append({
      auth: jwtClient,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Sheet1'",
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [
            index,
            report._id,
            report.createdAt.toUTCString().replaceAll(',','.'),
            report.reporters.length, 
            report.creatorId, 
            report.vehicle.creatorName, 
            report.vehicle.name, 
            report.vehicle.steamUrl, 
            originalVehicleName,
            originalVehicleUrl
          ]
        ]
      }
    })
  })
  logger.debug(`Vehicle #${steamId} has been pushed to the spreadsheet.`)
};

export async function updateSheetData() {
  // connect to google sheet
  const sheets = google.sheets({ 
    version: 'v4',
    auth: process.env.GOOGLE_API_KEY
  })

  // open a database connection
  await mongo().then(async () => {
    // get the report from the database
    const reports = await reportSchema.find({});

    // configure a new JWT auth client
    const jwtClient = new google.auth.JWT(
      privateKey.client_email,
      null,
      privateKey.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    )

    // authenticate request
    jwtClient.authorize(async (err, tokens) => {
      if (err) {
        logger.error(`Google sheets authorization error: ${err}`);
        return;
      }
    })

    // clear the sheet
    sheets.spreadsheets.values.clear({
      auth: jwtClient,
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "'Sheet1'"
    })

    // create the dataArray by iterating through the reports
    const dataArray = [
      ["0", "Report ID", "Report Created At", "Votes", "Author of vehicle ID", "Vehicle author name", "Vehicle name", "Vehicle URL", "Original Vehicle Name","Original Vehicle URL"]
    ]
    let index = 1;
    reports.forEach(report => {
      let originalVehicleUrl = "-";
      let originalVehicleName = "-";
      if (report.originalVehicle.name) {
        originalVehicleName = report.originalVehicle.name;
        originalVehicleUrl = report.originalVehicle.steamUrl;
      }

      dataArray.push([
        index,
        report._id,
        report.createdAt.toUTCString().replaceAll(',','.'),
        report.reporters.length, 
        report.creatorId, 
        report.vehicle.creatorName, 
        report.vehicle.name, 
        report.vehicle.steamUrl, 
        originalVehicleName,
        originalVehicleUrl
      ])
      index++;
    })

    logger.debug("Updating spreadsheet.(1/2)")
    // add the new values to the sheet after 5 seconds
    setTimeout(async () => {
      sheets.spreadsheets.values.update({
        auth: jwtClient,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "'Sheet1'",
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: dataArray
        }
      })
    }, 3000)
  })
  logger.debug("Spreadsheet updated.(2/2)")
}