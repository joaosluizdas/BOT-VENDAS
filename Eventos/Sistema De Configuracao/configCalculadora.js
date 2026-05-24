const { InteractionType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { JsonDatabase } = require("wio.db");
const { gerarEmbedCalculadora, gerarImagemCalculadoraReply, painelCalculadora } = require("../../Functions/CalculadoraRobux");

const calcConfig = new JsonDatabase({ databasePath: "./DataBaseJson/calculadoraConfig.json" });

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        // ====== BOTÕES ======
        if (interaction.isButton()) {

            // Abrir painel admin da calculadora
            if (interaction.customId === 'painel_calculadora') {
                return painelCalculadora(interaction);
            }

            // Ativar/desativar sistema
            if (interaction.customId === 'calc_toggle_status') {
                const atual = calcConfig.get('status') || false;
                calcConfig.set(`status`, !atual);
                await painelCalculadora(interaction);
                return interaction.followUp({
                    content: `${!atual ? Emojis.get(`checker`) || '' : Emojis.get('negative') || ``} | Sistema da Calculadora ${!atual ? `ativado` : 'desativado'}!`,
                    ephemeral: true
                });
            }

            // Configurar canal
            if (interaction.customId === 'calc_config_canal') {
                const modal = new ModalBuilder()
                    .setCustomId('calc_modal_canal')
                    .setTitle('Canal Automático - Calculadora');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('canal_id')
                            .setLabel('ID do Canal')
                            .setPlaceholder('Cole o ID do canal onde serão detectados os números')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

                return interaction.showModal(modal);
            }

            // Gerar imagem (botão do usuário) - calc_imagem_quantidade
            if (interaction.customId.startsWith('calc_imagem_')) {
                const quantidade = parseInt(interaction.customId.replace('calc_imagem_', ''));
                if (!isNaN(quantidade) && quantidade > 0) {
                    return gerarImagemCalculadoraReply(interaction, quantidade);
                }
            }

            // Gerar embed (botão do usuário) - calc_embed_quantidade
            if (interaction.customId.startsWith('calc_embed_')) {
                const quantidade = parseInt(interaction.customId.replace('calc_embed_', ''));
                if (!isNaN(quantidade) && quantidade > 0) {
                    return gerarEmbedCalculadoraAtualizar(interaction, quantidade);
                }
            }
        }

        // ====== MODAIS ======
        if (interaction.type === InteractionType.ModalSubmit) {

            if (interaction.customId === 'calc_modal_canal') {
                const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
                const canal = interaction.guild.channels.cache.get(canalId);

                if (!canal) {
                    return interaction.reply({
                        content: `${Emojis.get(`negative`)||''} | Canal não encontrado com o ID \`${canalId}\`. Verifique o ID e tente novamente.`,
                        ephemeral: true
                    });
                }

                calcConfig.set(`canal`, canalId);

                return interaction.reply({
                    content: `${Emojis.get(`checker`)||''} | Canal automático definido como <#${canalId}>!\n> Agora quando alguém digitar um número nesse canal, a calculadora será gerada automaticamente.`,
                    ephemeral: true
                });
            }
        }
    }
};

// Gerar embed inline (para o botão calc_embed_)
const { res } = require("../../res");
const { JsonDatabase: JDB2 } = require("wio.db");
const emojisDb = require("../../DataBaseJson/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

function formatBRL(v) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function gerarEmbedCalculadoraAtualizar(interaction, quantidade) {
    const robuxConfig = new JDB2({ databasePath: "./DataBaseJson/configuracaorobux.json" });
    const valorPor1000 = parseFloat(robuxConfig.get('config.valores.robux')) || 27;
    const valorGamepassPor1000 = parseFloat(robuxConfig.get('config.valores.gamepass')) || 27;
    const valorGrupoPor1000 = parseFloat(robuxConfig.get(`config.valores.robuxGrupo`)) || (valorPor1000 * 1.18);

    const precoSemTaxa = (quantidade / 1000) * valorPor1000;
    const recebeSemTaxa = Math.floor(quantidade * 0.7);
    const precoComTaxa = (quantidade / 0.7 / 1000) * valorPor1000;
    const gamepassNecessario = Math.ceil(quantidade / 0.7);
    const precoViaGrupo = (quantidade / 1000) * valorGrupoPor1000;
    const precoGamepassProduto = (quantidade / 1000) * valorGamepassPor1000;

    const containerContent = res.main(
        { type: 10, content: `# ${Emojis.get(`robux`) || Emojis.get('diamond') || ``} Calculadora Robux` },
        { type: 14 },
        { type: 10, content: `-# Preço estimado para ${quantidade.toLocaleString(`pt-BR`)} Robux\n**${quantidade.toLocaleString(`pt-BR`)} Robux informado**` },
        { type: 14 },
        { type: 10, content: `**${Emojis.get(`negative`) || ``} Robux sem taxa**\n> Preço: \`R$ ${formatBRL(precoSemTaxa)}\`\n> Você recebe: \`${recebeSemTaxa.toLocaleString(`pt-BR`)} Robux\` *(Roblox cobra 30%)*` },
        { type: 10, content: `**${Emojis.get(`checker`) || ``} Robux com taxa**\n> Preço: \`R$ ${formatBRL(precoComTaxa)}\`\n> Você recebe: \`${quantidade.toLocaleString(`pt-BR`)} Robux\` aproximados\n> Crie uma gamepass de: \`${gamepassNecessario.toLocaleString(`pt-BR`)} Robux\`` },
        { type: 10, content: `**${Emojis.get(`dinheiro`) || ``} Robux via grupo**\n> Preço: \`R$ ${formatBRL(precoViaGrupo)}\`\n> Você recebe: \`${quantidade.toLocaleString(`pt-BR`)} Robux\` exatos` },
        { type: 10, content: `**${Emojis.get(`robux`) || Emojis.get('diamond') || ''} Gamepass produto**\n> Preço: \`R$ ${formatBRL(precoGamepassProduto)}\`\n> Compra de gamepass pronta em produto` },
        { type: 14 },
        { type: 10, content: `-# Valores baseados no limite de 100.000 Robux` }
    ).with({ flags: [64] });

    try {
        await interaction.update(containerContent);
    } catch (e) {
        await interaction.reply(containerContent);
    }
}
