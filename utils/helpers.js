import * as Discord from 'discord.js';

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