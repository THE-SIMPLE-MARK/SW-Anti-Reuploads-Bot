import * as fs from 'fs/promises';
// check '--debug' flag
const debug = process.argv.includes('--debug');

const commands = async (client, dir) => {
	// get all files in {dir}
	const files = await fs.readdir(dir).catch(() => []);

	// return if there are no files
	if (!files) return;

	// loop through command files
	for await (const file of files) {
		// if file is folder run function recursively
		if ((await fs.stat(`./${dir}/${file}`)).isDirectory()) {
			commands(client, `./${dir}/${file}`);
			continue;
		}

		// import command from file
		const command = await import(`../${dir}/${file}`);
		// if no data skip registering command
		if (!command.data) {
			// debug message
			console.log(`${dir}/${file} >> No data found`);
			continue;
		}
		command.data.type = 'CHAT_INPUT';
		// add command to collection
		client.commands.set(command.data.name, command);
		// debug message
		console.log(`Command: ${command.data.name} >> Registered (1/2)`);
	}
};

const contexts = async (client, dir) => {
	// get all files in {dir}
	const files = await fs.readdir(dir).catch(() => []);

	// return if there are no files
	if (!files) return;

	// loop through context menu files
	for await (const file of files) {
		// if file is folder run function recursively
		if ((await fs.stat(`./${dir}/${file}`)).isDirectory()) {
			contexts(client, `./${dir}/${file}`);
			continue;
		}

		// import context menu from file
		const command = await import(`../${dir}/${file}`);
		// if no data skip registering context menu
		if (!command.data) {
			// debug message
			console.log(`${dir}/${file} >> No data found`);
			continue;
		}
		// add context menu to collection
		client.contexts.set(command.data.name, command);
		// debug message
		console.log(`Context menu: ${command.data.name} >> Registered (1/2)`);
	}
};

const buttons = async (client, dir) => {
	// get all files in {dir}
	const files = await fs.readdir(dir).catch(() => []);

	// return if there are no files
	if (!files) return;

	// loop through button files
	for await (const file of files) {
		// if file is folder run fuction recursively
		if ((await fs.stat(`./${dir}/${file}`)).isDirectory()) {
			buttons(client, `./${dir}/${file}`);
			continue;
		}

		// import button from file
		const button = await import(`../${dir}/${file}`);
		// if no data skip registering button
		if (!button.data) {
			// debug message
			console.log(`${dir}/${file} >> No data found`);
			continue;
		}
		// add button to collection
		client.buttons.set(button.data.id, button);
		// debug message
		console.log(`Button: ${button.data.id} >> Registered`);
	}
};

const menus = async (client, dir) => {
	// get all files in {dir}
	const files = await fs.readdir(dir).catch(() => []);

	// return if there are no files
	if (!files) return;

	// loop through menu files
	for await (const file of files) {
		// if file is folder run fuction recursively
		if ((await fs.stat(`./${dir}/${file}`)).isDirectory()) {
			menus(client, `./${dir}/${file}`);
			continue;
		}

		// import menu from file
		const menu = await import(`../${dir}/${file}`);
		// if no data skip registering menu
		if (!menu.data) {
			// debug message
			console.log(`${dir}/${file} >> No data found`);
			continue;
		}
		// add menu to collection
		client.menus.set(menu.data.id, menu);
		// debug message
		console.log(`Menu: ${menu.data.id} >> Registered`);
	}
};

const events = async (client, dir) => {
	// get all files in {dir}
	const files = await fs.readdir(dir).catch(() => []);

	// return if there are no files
	if (!files) return;

	// loop through event files
	for await (const file of files) {
		// if file is folder run fuction recursively
		if ((await fs.stat(`./${dir}/${file}`)).isDirectory()) {
			events(client, `./${dir}/${file}`);
			continue;
		}

		// import event from file
		const event = await import(`../${dir}/${file}`);

		// bind event to listener
		if (event.once) {
			client.once(event.name, (...args) => event.execute(client, ...args));
		} else {
			client.on(event.name, (...args) => event.execute(client, ...args));
		}
		// debug message
		console.log(`Event: ${event.name} >> Registered`);
	}
};

// export all functions
export { commands, contexts, buttons, menus, events };