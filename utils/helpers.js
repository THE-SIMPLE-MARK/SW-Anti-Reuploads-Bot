import { settingsSchema } from '../schemas/settings-schema.js';
import { mongo } from '../mongo.js';
import * as Discord from 'discord.js';
import * as config from '../config.json';
import { muteSchema } from '../schemas/mute-schema.js'
import { warnSchema } from '../schemas/warn-schema.js';
const footerImg = config.footerImg

// get colors from logo randomly

const colors = ['#252526','#36393F','#40444B','#99DDCC','#272727','#BCBCBF','#4C4C4C','#405471','#8299BB']

/**
 * @returns {string} Color code.
 */

export function getRandomColor() {
	return colors[Math.floor(Math.random() * colors.length)];
}



/**
 * @param {object} guild The guild object
 * @param {string} mention The mention to validate
 */

export function getRole(guild, mention) {
   try {
       if (!mention) return;
   
       if (mention.startsWith('<@&') && mention.endsWith('>')) {
           mention = mention.slice(3, -1);
       }
   
       const role = guild.roles.cache.get(mention) || guild.roles.cache.find(role => role.name === mention);
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
           mention = mention.slice(2, -1);
   
           if (mention.startsWith('!')) {
               mention = mention.slice(1);
           }
       }
   
       const member = guild.members.cache.get(mention) || guild.members.cache.find(member => member.user.tag === mention);
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
           mention = mention.slice(2, -1);
       }
       const channel = guild.channels.cache.get(mention) || guild.channels.cache.find((ch) => ch.name === mention);
       return channel;
   }
   catch(e) {
       return undefined;
   }
}



/**
 * @param {string} serverID ID of the server
 * @param {json} embed Embed to send to the log channel
 * @param {object} client The client object
 */

export async function logEvent(serverID, embed, client) {
    mongo().then(async () => {
        try {
            let settings = await settingsSchema.find({ "serverID": serverID })
            if (!settings.length) return
    
            if (settings[0].logChannelId === 'off') return
            let channel = client.channels.cache.get(settings[0].logChannelId)
            if (client.guilds.cache.get(serverID).me.permissions.has('SEND_MESSAGES')) channel.send({ embeds: [embed] })
        }
        catch(e) {
            console.log(`Log Event >> Failed to log event in "${client.guilds.cache.get(serverID).name}". Reason: ${e.message}.`)
        }
    });
}



/**
 * @param {string} reason Mute reason
 * @param {number} duration Mute duration (MS)
 * @param {object} message Message object
 * @param {object} user Target's object
 * @param {object} client Client Object
 */

export const autoMute = async (reason, duration, message, user, client) => {
    await mongo().then(async () => {
	// get all required variables for the document
	const target = user
	const member = message.author
	const createdAt = new Date()
	const messageLink = message.url
	
	// construct the log embed
    const log = new Discord.MessageEmbed()
        .setColor("#C1C1C1")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setAuthor(staff.user.tag, staff.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**Member:** \`${user.tag}\` (${user.id})\n**Action:** Mute (Automod)\n**Duration:** ${duration} MS\n**Moderator:** \`${staff.user.tag}\` (${staff.id})`)
        .setTimestamp()
    
    // make and save the document
    await new muteSchema({ "targetId": target, "memberId": member, "reason": reason, "createdAt": createdAt, "duration": duration, "messageLink": messageLink }).save().then(
        logEvent(message.guild.id, log, client)
    )
    })
}



/**
 * @param {string} reason Warn reason
 * @param {object} message Message object
 * @param {object} user Target's object
 * @param {object} client Client Object
 */

 export const autoWarn = async (reason, duration, message, user, client) => {
    await mongo().then(async () => {
    // get all required variables for the document
	const target = user
	const reason = reason
	const member = message.author
	const createdAt = new Date()
	const messageLink = message.url
	
	// construct the log embed
    const log = new Discord.MessageEmbed()
        .setColor("#C1C1C1")
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setAuthor(staff.user.tag, staff.user.displayAvatarURL({ dynamic: true }))
        .setDescription(`**Member:** \`${user.tag}\` (${user.id})\n**Action:** Mute (Automod)\n**Duration:** 10 minutes\n**Moderator:** \`${staff.user.tag}\` (${staff.id})`)
        .setTimestamp()
    
    // make and save the document
    await new warnSchema({ "targetId": target, "memberId": member, "reason": reason, "createdAt": createdAt, "messageLink": messageLink }).save().then(
        logEvent(message.guild.id, log, client)
    )
    })
}