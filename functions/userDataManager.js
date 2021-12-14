import { mongo } from '../mongo.js';
import { profileSchema } from '../schemas.js';

/**
 * @param {object} client The client object
 */

export const userDataManager = async (client) => {
    console.log("User Data Manager >> Online")

    client.on('interactionCreate', async (interaction) => {
        // connect to database
        await mongo().then(async () => {
            if (interaction.user.bot) return;
            // check if user has a profile
            const profile = await profileSchema.findOne({ discordId: interaction.user.id });
            // if it doesn't exist, create it
            if (!profile) {
                await new profileSchema({
                    discordId: interaction.user.id,
                    createdAt: new Date(),
                    lastActive: new Date(),
                    isModerator: false,
                    isAdmin: false,
                    suspended: false,
                    rank: 0,
                }).save()
            } else {
                // update last active
                await profileSchema.updateOne({ discordId: interaction.user.id }, { lastActive: new Date() });
            }
        });
    });
}