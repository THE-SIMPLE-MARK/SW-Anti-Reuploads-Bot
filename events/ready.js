export const name = 'ready';
export const once = true;

import { mongo } from "../mongo.js";
import { logger } from "../utils/logger.js";

const setInteractions = true; // wether to set the commands&context menus on startup
export const guildId = '922222139468304434';
const privateCommands = [];
const globalCommands = [];
const testing = false; // enable this to register all commands private

export const execute = async (client) => {
	// set presence
	client.user.setPresence({
		activities: [{ name: 'slash commands.', type: 'LISTENING' }],
		status: 'online',
	});

	if (setInteractions) {
		// set commands
		client.commands.each(async (command) => {
			if (command.privateCommand === true || testing) {
				privateCommands.push(command.data)
				console.log(`Command: ${command.data.name} >> Registered as private (2/2)`)
			} else {
				globalCommands.push(command.data)
				console.log(`Command: ${command.data.name} >> Registered as global (2/2)`)
			}
		});
	
		client.application.commands.set(
			privateCommands,
			guildId
		);
		client.application.commands.set(
			globalCommands,
		);
	
		// set context menus
		client.contexts.each(async (command) => {
			const cmd = await client.application.commands.create(
				command.data,
				guildId
			);
			if (command.permissions)
				cmd.permissions?.set({ permissions: command.permissions });
		});
	} else {
		console.log('Interactions >> Skipped registering interactions.')
	}
	logger.info(`Logged in as ${client.user.tag}`)
	console.log(`${client.user.tag} >> Logged in!`)
	console.log(`Winston Logging Utility >> Online`)

	// log into database
	await mongo().then(mongoose => { try { console.log('Database >> Connected to mongoose. Database fully operational!') } finally { mongoose.connection.close() } })
};