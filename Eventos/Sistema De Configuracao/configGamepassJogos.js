const { InteractionType, ActionRowBuilder } = require("discord.js");
const {
    painelGamepassJogos, modalAdicionarJogo, handleModalAdicionarJogo,
    painelGerenciarJogos, painelJogo,
    painelCategorias, modalCriarCategoria, handleModalCriarCategoria, removerCategoria,
    painelGerenciarCategoria, modalEditarProduto, handleModalEditarProduto,
    modalCriarProduto, handleModalCriarProduto,
    painelVerProdutos, painelProduto,
    modalEnviarPainelJogo, enviarPainelJogoNoCanal,
    modalEnviarMensagemJogos, enviarMensagemJogos,
    painelComprarJogo, painelCategoriaPublica, mostrarProdutoParaCompra,
    criarCarrinhoJogo, confirmarPedidoJogo, cancelarCarrinhoJogo,
    gamepassJogos,
    painelLogsJogos, modalLogChannel, handleModalLogChannel,
} = require("../../Functions/GamepassProdutos");
const emojisDb = require("../../DataBaseJson/emojis.json");
const Emojis = { get: (name) => emojisDb[name] || "" };

module.exports = {
    name: 'interactionCreate',

    run: async (interaction, client) => {

        // ====== MODAIS ======
        if (interaction.type === InteractionType.ModalSubmit) {

            // Adicionar jogo
            if (interaction.customId === 'gpj_modal_add_jogo') {
                return handleModalAdicionarJogo(interaction);
            }

            // Criar categoria num jogo: gpj_modal_cat_{universeId}
            if (interaction.customId.startsWith('gpj_modal_cat_')) {
                const universeId = interaction.customId.replace('gpj_modal_cat_', '');
                return handleModalCriarCategoria(interaction, universeId);
            }

            // Criar produto num jogo: gpj_modal_criar_produto_{universeId}
            // IMPORTANTE: verificar que NÃO é o handler de categoria antes
            if (interaction.customId.startsWith('gpj_modal_criar_produto_') && !interaction.customId.startsWith('gpj_modal_criar_produto_cat_')) {
                const universeId = interaction.customId.replace('gpj_modal_criar_produto_', '');
                return handleModalCriarProduto(interaction, universeId);
            }

            // Enviar painel de jogo específico num canal: gpj_modal_enviar_jogo_{universeId}
            if (interaction.customId.startsWith('gpj_modal_enviar_jogo_')) {
                const universeId = interaction.customId.replace('gpj_modal_enviar_jogo_', '');
                const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
                const canal = interaction.guild.channels.cache.get(canalId);
                if (!canal) {
                    return interaction.reply({ content: `${Emojis.get(`negative`) || `❌`} | Canal não encontrado com o ID \`${canalId}\`.`, ephemeral: true });
                }
                await interaction.deferReply({ ephemeral: true });
                const ok = await enviarPainelJogoNoCanal(interaction, universeId, canalId, client);
                if (ok) {
                    await interaction.editReply({ content: `${Emojis.get(`checker`) || `✅`} | Painel do jogo enviado em <#${canalId}>!` });
                } else {
                    await interaction.editReply({ content: `${Emojis.get(`negative`) || '❌'} | Erro ao enviar painel. Verifique se o jogo possui produtos ativos.` });
                }
                return;
            }

            // Editar produto: gpj_modal_edit_produto_{universeId}|||{produtoId}
            if (interaction.customId.startsWith('gpj_modal_edit_produto_')) {
                const rest = interaction.customId.replace('gpj_modal_edit_produto_', '');
                const sep = rest.indexOf('|||');
                if (sep !== -1) {
                    const universeId = rest.slice(0, sep);
                    const produtoId = rest.slice(sep + 3);
                    return handleModalEditarProduto(interaction, universeId, produtoId);
                }
            }

            // Criar produto numa categoria específica: gpj_modal_criar_produto_cat_{universeId}|||{catId}
            if (interaction.customId.startsWith('gpj_modal_criar_produto_cat_')) {
                const rest = interaction.customId.replace('gpj_modal_criar_produto_cat_', '');
                const sep = rest.indexOf('|||');
                if (sep !== -1) {
                    const universeId = rest.slice(0, sep);
                    const catId = rest.slice(sep + 3);
                    return handleModalCriarProduto(interaction, universeId, catId);
                }
            }

            // Logs: definir canal — gpj_modal_log_{tipo}
            if (interaction.customId.startsWith('gpj_modal_log_')) {
                const tipo = interaction.customId.replace('gpj_modal_log_', '');
                return handleModalLogChannel(interaction, tipo);
            }

            // Enviar painel geral (todos os jogos): gpj_modal_enviar_msg
            if (interaction.customId === 'gpj_modal_enviar_msg') {
                const canalId = interaction.fields.getTextInputValue(`canal_id`).trim();
                const canal = interaction.guild.channels.cache.get(canalId);
                if (!canal) {
                    return interaction.reply({ content: `${Emojis.get(`negative`) || `❌`} | Canal não encontrado com o ID \`${canalId}\`.`, ephemeral: true });
                }
                await interaction.deferReply({ ephemeral: true });
                const ok = await enviarMensagemJogos(interaction, canalId, client);
                if (ok === null) {
                    await interaction.editReply({ content: `${Emojis.get(`negative`) || `❌`} | Nenhum jogo com produtos ativos cadastrado!` });
                } else if (ok) {
                    await interaction.editReply({ content: `${Emojis.get(`checker`) || `✅`} | Painel geral de jogos enviado em <#${canalId}>!` });
                } else {
                    await interaction.editReply({ content: `${Emojis.get(`negative`) || '❌'} | Erro ao enviar painel.` });
                }
                return;
            }
        }

        // ====== SELECT MENUS ======
        if (interaction.isStringSelectMenu()) {

            // Admin: selecionar jogo para gerenciar
            if (interaction.customId === 'gpj_select_jogo') {
                const jogoKey = interaction.values[0];
                return painelJogo(interaction, jogoKey);
            }

            // Admin: selecionar produto para gerenciar
            if (interaction.customId === 'gpj_select_produto') {
                // value: gpj_prod_{universeId}|||{produtoId}  (sep=||| para suportar universeId com _)
                const raw = interaction.values[0];
                const rest = raw.replace('gpj_prod_', '');
                const sep = rest.indexOf('|||');
                let universeId, produtoId;
                if (sep !== -1) {
                    universeId = rest.slice(0, sep);
                    produtoId = rest.slice(sep + 3);
                } else {
                    // legado: split simples
                    const parts = raw.split('_');
                    universeId = parts[2];
                    produtoId = parts.slice(3).join('_');
                }
                return painelProduto(interaction, universeId, produtoId);
            }

            // Admin: selecionar categoria para gerenciar
            if (interaction.customId === 'gpj_select_cat') {
                // value: gpj_cat_{universeId}|||{catId}
                const raw = interaction.values[0];
                const sep = raw.indexOf('|||');
                if (sep !== -1) {
                    const universeId = raw.slice('gpj_cat_'.length, sep);
                    const catId = raw.slice(sep + 3);
                    return painelGerenciarCategoria(interaction, universeId, catId);
                }
                // Legado: gpj_cat_{universeId}_{catId} (uuid sem underscore)
                const parts = raw.split('_');
                const universeId2 = parts[2];
                const catId2 = parts.slice(3).join('_');
                return painelGerenciarCategoria(interaction, universeId2, catId2);
            }

            // Público: seleção de jogo no painel geral — sempre ephemeral
            if (interaction.customId === 'comprar_jogo_select') {
                const value = interaction.values[0]; // comprar_jogo_{universeId}
                const universeId = value.replace('comprar_jogo_', '');
                await interaction.deferReply({ ephemeral: true });
                return painelComprarJogo(interaction, universeId, client);
            }

            // Público: seleção de categoria num painel de jogo
            // value: cat_jogo_{universeId}|||{catId}
            if (interaction.customId === 'comprar_cat_select') {
                const raw = interaction.values[0];
                const rest = raw.replace('cat_jogo_', '');
                const sepIdx = rest.indexOf('|||');
                let universeId, catId;
                if (sepIdx !== -1) {
                    universeId = rest.slice(0, sepIdx);
                    catId = rest.slice(sepIdx + 3);
                } else {
                    // legado: split por _
                    const parts = rest.split('_');
                    universeId = parts[0];
                    catId = parts.slice(1).join('_');
                }
                return painelCategoriaPublica(interaction, universeId, catId, client);
            }

            // Público: seleção de produto num painel de jogo (sem categorias ou dentro de categoria)
            // value: comprar_produto_jogo_{universeId}|||{produtoId}
            if (interaction.customId === 'comprar_produto_select') {
                const raw = interaction.values[0];
                if (raw.startsWith('comprar_produto_jogo_')) {
                    const rest = raw.replace('comprar_produto_jogo_', '');
                    const sepIdx = rest.indexOf('|||');
                    if (sepIdx !== -1) {
                        const universeId = rest.slice(0, sepIdx);
                        const produtoId = rest.slice(sepIdx + 3);
                        return criarCarrinhoJogo(interaction, universeId, produtoId, client);
                    }
                    // Legado: primeiro underscore
                    const firstUnderscore = rest.indexOf('_');
                    const universeId = rest.slice(0, firstUnderscore);
                    const produtoId = rest.slice(firstUnderscore + 1);
                    return criarCarrinhoJogo(interaction, universeId, produtoId, client);
                }
            }
        }

        // ====== BOTÕES ======
        if (interaction.isButton()) {

            // Voltar ao painel principal de jogos
            if (interaction.customId === 'gpj_painel_main') {
                return painelGamepassJogos(interaction);
            }

            // Abrir painel de logs
            if (interaction.customId === 'gpj_logs') {
                return painelLogsJogos(interaction);
            }

            // Definir canal de log: gpj_log_set_{tipo}
            if (interaction.customId.startsWith('gpj_log_set_')) {
                const tipo = interaction.customId.replace('gpj_log_set_', '');
                return modalLogChannel(interaction, tipo);
            }

            // Limpar canal de log: gpj_log_clear_{tipo}
            if (interaction.customId.startsWith('gpj_log_clear_')) {
                const tipo = interaction.customId.replace('gpj_log_clear_', '');
                const cfg = gamepassJogos.get('_logs_config') || {};
                delete cfg[tipo];
                gamepassJogos.set('_logs_config', cfg);
                await interaction.deferUpdate();
                return painelLogsJogos(interaction);
            }

            // Adicionar jogo
            if (interaction.customId === 'gpj_adicionar_jogo') {
                return modalAdicionarJogo(interaction);
            }

            // Gerenciar jogos
            if (interaction.customId === 'gpj_gerenciar_jogos') {
                return painelGerenciarJogos(interaction);
            }

            // Enviar painel geral (todos os jogos)
            if (interaction.customId === 'gpj_enviar_mensagem') {
                return modalEnviarMensagemJogos(interaction);
            }

            // Voltar para o painel de um jogo: gpj_jogo_{universeId}
            if (interaction.customId.startsWith('gpj_jogo_')) {
                const universeId = interaction.customId.replace('gpj_jogo_', '');
                return painelJogo(interaction, `jogo_${universeId}`);
            }

            // Abrir painel de categorias: gpj_categorias_{universeId}
            if (interaction.customId.startsWith('gpj_categorias_')) {
                const universeId = interaction.customId.replace('gpj_categorias_', '');
                return painelCategorias(interaction, universeId);
            }

            // Adicionar nova categoria: gpj_add_cat_{universeId}
            if (interaction.customId.startsWith('gpj_add_cat_')) {
                const universeId = interaction.customId.replace('gpj_add_cat_', '');
                return modalCriarCategoria(interaction, universeId);
            }

            // Criar produto: gpj_criar_produto_{universeId}
            if (interaction.customId.startsWith('gpj_criar_produto_')) {
                const universeId = interaction.customId.replace('gpj_criar_produto_', '');
                return modalCriarProduto(interaction, universeId);
            }

            // Ver produtos: gpj_ver_produtos_{universeId}
            if (interaction.customId.startsWith('gpj_ver_produtos_')) {
                const universeId = interaction.customId.replace('gpj_ver_produtos_', '');
                return painelVerProdutos(interaction, universeId);
            }

            // Voltar para o painel de categorias do jogo (Público)
            if (interaction.customId.startsWith('comprar_voltar_jogo_')) {
                const universeId = interaction.customId.replace('comprar_voltar_jogo_', '');
                return painelComprarJogo(interaction, universeId, client);
            }

            // Botão de compra no painel enviado (Público) — sempre ephemeral
            if (interaction.customId.startsWith('comprar_jogo_btn_')) {
                const universeId = interaction.customId.replace('comprar_jogo_btn_', '');
                await interaction.deferReply({ ephemeral: true });
                return painelComprarJogo(interaction, universeId, client);
            }

            // Enviar painel de jogo específico: gpj_enviar_jogo_{universeId}
            if (interaction.customId.startsWith('gpj_enviar_jogo_')) {
                const universeId = interaction.customId.replace('gpj_enviar_jogo_', '');
                return modalEnviarPainelJogo(interaction, universeId);
            }

            // Remover jogo: gpj_remover_jogo_{universeId}
            if (interaction.customId.startsWith('gpj_remover_jogo_')) {
                const universeId = interaction.customId.replace('gpj_remover_jogo_', ``);
                gamepassJogos.delete(`jogo_${universeId}`);
                await painelGerenciarJogos(interaction);
                return interaction.followUp({ content: `${Emojis.get(`checker`) || '✅'} | Jogo removido!`, ephemeral: true });
            }

            // Toggle produto ativo/inativo: gpj_toggle_prod_{universeId}_{produtoId}
            if (interaction.customId.startsWith('gpj_toggle_prod_')) {
                const rest = interaction.customId.replace('gpj_toggle_prod_', '');
                const firstUnderscore = rest.indexOf('_');
                const universeId = rest.slice(0, firstUnderscore);
                const produtoId = rest.slice(firstUnderscore + 1);
                const jogoKey = `jogo_${universeId}`;
                const jogo = gamepassJogos.get(jogoKey);
                if (jogo) {
                    const produtos = jogo.produtos || [];
                    const prod = produtos.find(p => p.id === produtoId);
                    if (prod) { prod.status = !prod.status; gamepassJogos.set(`${jogoKey}.produtos`, produtos); }
                }
                return painelProduto(interaction, universeId, produtoId);
            }

            // Excluir produto: gpj_excluir_prod_{universeId}_{produtoId}
            if (interaction.customId.startsWith('gpj_excluir_prod_')) {
                const rest = interaction.customId.replace('gpj_excluir_prod_', '');
                const firstUnderscore = rest.indexOf(`_`);
                const universeId = rest.slice(0, firstUnderscore);
                const produtoId = rest.slice(firstUnderscore + 1);
                const jogoKey = `jogo_${universeId}`;
                const jogo = gamepassJogos.get(jogoKey);
                if (jogo) {
                    const produtos = (jogo.produtos || []).filter(p => p.id !== produtoId);
                    gamepassJogos.set(`${jogoKey}.produtos`, produtos);
                }
                await painelVerProdutos(interaction, universeId);
                return interaction.followUp({ content: `${Emojis.get(`checker`) || '✅'} | Produto removido!`, ephemeral: true });
            }

            // Editar produto: gpj_editar_prod_{universeId}|||{produtoId}
            if (interaction.customId.startsWith('gpj_editar_prod_')) {
                const rest = interaction.customId.replace('gpj_editar_prod_', '');
                const sep = rest.indexOf('|||');
                if (sep !== -1) {
                    const universeId = rest.slice(0, sep);
                    const produtoId = rest.slice(sep + 3);
                    return modalEditarProduto(interaction, universeId, produtoId);
                }
            }

            // Remover categoria: gpj_remover_cat_{universeId}|||{catId}
            if (interaction.customId.startsWith('gpj_remover_cat_')) {
                const rest = interaction.customId.replace('gpj_remover_cat_', '');
                const sep = rest.indexOf('|||');
                if (sep !== -1) {
                    const universeId = rest.slice(0, sep);
                    const catId = rest.slice(sep + 3);
                    return removerCategoria(interaction, universeId, catId);
                }
            }

            // Adicionar produto a uma categoria: gpj_add_prod_cat_{universeId}|||{catId}
            if (interaction.customId.startsWith('gpj_add_prod_cat_')) {
                const rest = interaction.customId.replace('gpj_add_prod_cat_', '');
                const sep = rest.indexOf('|||');
                if (sep !== -1) {
                    const universeId = rest.slice(0, sep);
                    const catId = rest.slice(sep + 3);
                    return modalCriarProduto(interaction, universeId, catId);
                }
            }

            // Carrinho de jogo: confirmar pedido — gpj_confirmar_pedido_{universeId}_{produtoId}
            if (interaction.customId.startsWith('gpj_confirmar_pedido_')) {
                const rest = interaction.customId.replace('gpj_confirmar_pedido_', '');
                const firstUnderscore = rest.indexOf('_');
                const universeId = rest.slice(0, firstUnderscore);
                const produtoId = rest.slice(firstUnderscore + 1);
                return confirmarPedidoJogo(interaction, universeId, produtoId, client);
            }

            // Carrinho de jogo: cancelar pedido
            if (interaction.customId === 'gpj_cancelar_carrinho') {
                return cancelarCarrinhoJogo(interaction, client);
            }

            // Legado: cancelar compra pública (antigo)
            if (interaction.customId === 'gpj_cancelar_compra') {
                return interaction.update({ content: '', embeds: [], components: [] });
            }
        }
    }
};
