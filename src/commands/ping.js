const { SlashCommandBuilder } = require('@discordjs/builders');
const client = require('..');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(client, interaction) {
		await interaction.reply("Pong!");
	},
};