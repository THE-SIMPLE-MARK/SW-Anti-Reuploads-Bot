import * as Discord from 'discord.js';

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