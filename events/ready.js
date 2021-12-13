export const name = 'ready';
export const once = true;

import { mongo } from "../mongo.js";

const setInteractions = true; // wether to set the commands&context menus on startup
const guildId = '899639850536411136';
const privateCommands = [];
const globalCommands = [];
const testing = true; // enable this to register all commands private
const fullPermissions = [];

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
	console.log(`${client.user.tag} >> Logged in!`);

	// log into database
	await mongo().then(mongoose => { try { console.log('Database >> Connected to mongoose. Database fully operational!') } finally { mongoose.connection.close() } })
};