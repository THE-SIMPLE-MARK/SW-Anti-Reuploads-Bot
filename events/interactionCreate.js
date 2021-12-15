export const name = 'interactionCreate';
import { mongo } from "../mongo.js";
import { profileSchema } from "../schemas.js";
import { RateLimiter } from "discord.js-rate-limiter";

const rateLimiter = new RateLimiter(3,10*1000);

export const execute = async (client, interaction) => {
	// if bot, ignore
	if (interaction.user.bot) return;

	// connect to database
	let isMod = false;
	let isAdmin = false;
	let isSuspended = false;
	await mongo().then(async () => {
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

		// get user profile
		const profileAfter = await profileSchema.findOne({ discordId: interaction.user.id });
		isMod = profileAfter.isModerator
		isAdmin = profileAfter.isAdmin
		isSuspended = profileAfter.suspended
	});
	
	// stop user from using the bot if they are suspended
	if (isSuspended) return await interaction.reply({
		content: 'You have been suspended from using this bot. Ban appeals are not yet available.',
		ephemeral: true,
	})

	// CHAT_INPUT commands
	if (interaction.isCommand()) {
		// if not in collection return
		if (!client.commands.has(interaction.commandName)) return;
		// check if user is rate limited
		if (rateLimiter.take(interaction.user.id)) return await interaction.reply({
			content: 'You are being rate limited. Please wait a few seconds and try again.',
			ephemeral: true,
		});

		try {
			// execute command logic
			await client.commands
				.get(interaction.commandName)
				.execute(client, interaction, isMod, isAdmin);
		} catch (error) {
            console.error(error)
			// respond with error messsage
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}

	// USER, & MESSAGE commands
	if (interaction.isContextMenu()) {
		// if not in collection return
		if (!client.contexts.has(interaction.commandName)) return;
		// check if user is rate limited
		if (rateLimiter.take(interaction.user.id)) return await interaction.reply({
			content: 'You are being rate limited. Please wait a few seconds and try again.',
			ephemeral: true,
		});

		try {
			// execute command logic
			await client.contexts
				.get(interaction.commandName)
				.execute(client, interaction, interaction.options.getMessage('message'), isMod, isAdmin);
		} catch (error) {
            console.error(error)
			// respond with error message
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}

	// BUTTON interactions
	if (interaction.isButton()) {
		// if not in collection return
		if (!client.buttons.has(interaction.customId)) return;
		// check if user is rate limited
		if (rateLimiter.take(interaction.user.id)) return await interaction.reply({
			content: 'You are being rate limited. Please wait a few seconds and try again.',
			ephemeral: true,
		});

		try {
			// execute button logic
			await client.buttons
				.get(interaction.customId)
				.execute(client, interaction, isMod, isAdmin);
		} catch (error) {
            console.error(error)
			// respond with error message
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}

	// MENU interactions
	if (interaction.isSelectMenu()) {
		// if not in collection return
		if (!client.menus.has(interaction.customId)) return;
		// check if user is rate limited
		if (rateLimiter.take(interaction.user.id)) return await interaction.reply({
			content: 'You are being rate limited. Please wait a few seconds and try again.',
			ephemeral: true,
		});

		try {
			// execute menu logic
			await client.menus.get(interaction.customId).execute(client, interaction);
		} catch (error) {
            console.error(error)
			// respond with error message
			await interaction.reply({
				content: 'There was an error while executing this command!',
				ephemeral: true,
			});
		}
	}
};