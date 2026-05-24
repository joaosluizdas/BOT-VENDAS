const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    run: async (interaction, client) => {

        // ── Botão: Ranking Compradores no painel ──────────────────────────
        if (interaction.isButton() && interaction.customId === 'painelrankingcompras') {
            const rankingCmd = client.slashCommands.get('ranking-compras');
            if (!rankingCmd) {
                return interaction.reply({ content: '❌ Comando de ranking não carregado.', ephemeral: true });
            }
            return rankingCmd.run(client, interaction);
        }
    }
};
