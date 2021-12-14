import { Client, Intents, Collection } from 'discord.js';
import 'dotenv/config';

import { userDataManager } from './functions/userDataManager.js';

import {
	commands,
	contexts,
	buttons,
	events,
	menus,
} from './utils/registry.js';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS],
	disableEveryone: true
});

//userDataManager(client);

client.commands = new Collection();
client.contexts = new Collection();
client.buttons = new Collection();
client.menus = new Collection();

await commands(client, './commands');
await contexts(client, './context menus');
await buttons(client, './components/buttons');
await menus(client, './components/menus');
await events(client, './events');

client.login(process.env.BOT_TOKEN);
