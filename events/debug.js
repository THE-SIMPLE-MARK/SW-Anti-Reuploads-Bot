export const name = 'debug';

export const execute = (client, info) => {
	if (process.argv.includes('--debug')) console.log(info);
};