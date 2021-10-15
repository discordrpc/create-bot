module.exports = (interaction) => {
    const client = interaction.client;

    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName)

        command.execute(client, interaction);
    }
}