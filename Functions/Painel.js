const { ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require("discord.js");
const { produtos, EmojisHelper } = require("../DataBaseJson");
const { res } = require("../res");
const fs = require("fs");
const path = require("path");
const startTime = Date.now();

const Emojis = EmojisHelper;

function safeEmoji(name) {
    const e = EmojisHelper.get(name);
    return (e && e.trim().length > 0) ? e : null;
}

function applyEmoji(btn, name, fallback) {
    const e = safeEmoji(name);
    const f = e || fallback;
    if (f && f.trim().length > 0) btn.setEmoji(f);
    return btn;
}

function getSaudacao() {
    const brazilTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const hora = new Date(brazilTime).getHours();
    if (hora < 12) return 'Bom dia';
    else if (hora < 18) return 'Boa tarde';
    else return 'Boa noite';
}

async function Painel(interaction, client) {

    const row2 = new ActionRowBuilder()
        .addComponents(
            applyEmoji(new ButtonBuilder().setCustomId("painelconfigvendas").setLabel('Sistema Vendas').setStyle(2).setDisabled(false), 'sacola', Emojis.get('_cart_emoji') || ''),
            applyEmoji(new ButtonBuilder().setCustomId("painelconfigticket").setLabel('Sistema Ticket').setStyle(2).setDisabled(false), 'ticketpanel', Emojis.get('_ticket_emoji') || ''),
            applyEmoji(new ButtonBuilder().setCustomId("painelconfigbv").setLabel('Boas Vindas').setStyle(2).setDisabled(false), 'welcomepanel', Emojis.get('members') || ''),
            applyEmoji(new ButtonBuilder().setCustomId("eaffaawwawa").setLabel('Ações Automaticas').setStyle(2).setDisabled(false), 'comerciopanel', Emojis.get('_settings_emoji') || ''),
        )

    const row3 = new ActionRowBuilder()
        .addComponents(
            applyEmoji(new ButtonBuilder().setCustomId("painelpersonalizar").setLabel('Personalizar Bot').setStyle(2).setDisabled(false), 'panelpersonalizado', Emojis.get('_pincel_emoji') || ''),
            applyEmoji(new ButtonBuilder().setCustomId("sistemaauth").setLabel('WinnBuxx').setStyle(2).setDisabled(false), 'ecloud', `${Emojis.get('cloud')||''}️`),
            applyEmoji(new ButtonBuilder().setCustomId("rendimento").setLabel('Rendimentos').setStyle(2).setDisabled(false), 'financepanel', Emojis.get('dinheiro') || ''),
            applyEmoji(new ButtonBuilder().setCustomId("gerenciarconfigs").setLabel('Configurações Gerais').setStyle(2).setDisabled(false), '_settings_emoji', Emojis.get('_settings_emoji') || ''),
        )

    const row9 = new ActionRowBuilder()
        .addComponents(
            applyEmoji(new ButtonBuilder().setLabel('Sistema de Sorteios').setStyle(2).setCustomId('sistemasorteios').setDisabled(false), 'configpanel', Emojis.get('gift') || ''),
            applyEmoji(new ButtonBuilder().setLabel('WinnBuxx').setStyle(2).setCustomId('painelconfigrobux').setDisabled(false), 'robux', Emojis.get('diamond') || ''),
        )

    const row10 = new ActionRowBuilder()
        .addComponents(
            applyEmoji(new ButtonBuilder().setLabel('Gift Cards').setStyle(2).setCustomId('painelgiftcard').setDisabled(false), 'codigo', Emojis.get('gift') || ''),
            applyEmoji(new ButtonBuilder().setLabel('Sistema IA').setStyle(2).setCustomId('painelistema').setDisabled(false), 'robotemoji', Emojis.get('robot') || ''),
            applyEmoji(new ButtonBuilder().setLabel('Aviso de Stock').setStyle(2).setCustomId('painelstockauto').setDisabled(false), 'antena', Emojis.get('antena') || ''),
            applyEmoji(new ButtonBuilder().setLabel('Monitor Feedbacks').setStyle(2).setCustomId('painel_feedback_monitor').setDisabled(false), 'robotemoji', Emojis.get('codigocopia') || ''),
        )

    // ── Novos sistemas integrados ─────────────────────────────────────────
    const rowFilas = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setLabel('Filas de Apostas').setStyle(2).setCustomId('painelconfigfilas').setEmoji({ id: '1500295102151786617' }),
            new ButtonBuilder().setLabel('Scripts Roblox').setStyle(2).setCustomId('painelconfigscripts').setEmoji({ id: '1500295100574728202' }),
            new ButtonBuilder().setLabel('Ranking Compradores').setStyle(2).setCustomId('painelrankingcompras').setEmoji({ id: '1500295256271360030' }),
        )

    // ── Sistemas extras (Moderação, Verificação) ──────────────────────────
    const rowExtras = new ActionRowBuilder()
        .addComponents(
            applyEmoji(new ButtonBuilder().setLabel('Moderação').setStyle(2).setCustomId('sistemamoderacao').setDisabled(false), 'negative', '🛡️'),
            applyEmoji(new ButtonBuilder().setLabel('Verificação Captcha').setStyle(2).setCustomId('painelverificacao').setDisabled(false), 'sucesso', '🔒'),
            applyEmoji(new ButtonBuilder().setLabel('GIFs Automáticos').setStyle(2).setCustomId('painelgifs').setDisabled(false), 'antena', '📡'),
            applyEmoji(new ButtonBuilder().setLabel('Formulário Staff').setStyle(2).setCustomId('painelformulario').setDisabled(false), '_settings_emoji', '📋'),
        )

    const epro = Emojis.get('epro') || Emojis.get('_settings_emoji') || '';
    const antena = Emojis.get('antena') || '';
    const relogio = Emojis.get('relogio') || '';

    const bannerPath = path.join(__dirname, '../Assets/painel_banner.jpg');
    let bannerAttachment = null;
    try {
        if (fs.existsSync(bannerPath)) {
            const bannerBuffer = fs.readFileSync(bannerPath);
            bannerAttachment = new AttachmentBuilder(bannerBuffer, { name: 'painel_banner.jpg' });
        }
    } catch (e) {}

    const containerContent = res.main(
        ...(bannerAttachment ? [
            { type: 12, items: [{ media: { url: 'attachment://painel_banner.jpg' }, spoiler: false }] },
            { type: 14 },
        ] : []),
        { type: 10, content: `-# WinnBuxx - Painel Principal` },
        { type: 14 },
        { type: 10, content: `-# - **Olá ${interaction.user} seja bem vindo ao painel principal do seu bot, utilize os botões abaixo para configurar sua aplicação**` },
        { type: 14 },
        { type: 10, content: `> ${epro} **Versão do eOS:** \`3.9.8\`\n> ${antena} **Ping:** \`${client.ws.ping} ms\`\n> ${relogio} **Uptime:** <t:${Math.ceil(startTime / 1000)}:R>` }
    ).with({
        components: [row2, row3, row9, row10, rowFilas, rowExtras],
        flags: [64],
        ...(bannerAttachment ? { files: [bannerAttachment] } : {})
    });

    try {
        if (interaction.message == undefined) {
            await interaction.reply(containerContent);
        } else {
            await interaction.update(containerContent);
        }
    } catch (err) {
        console.error('[Painel] Erro ao responder:', err.message);
        try { await interaction.reply({ content: `${Emojis.get('negative')||''} Ocorreu um erro ao abrir o painel.`, flags: [64] }); } catch {}
    }
}

async function Gerenciar2(interaction, client) {

    const ggg = produtos.valueArray();

    const rowVoltar = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("voltar00")
                .setLabel('Voltar')
                
                .setStyle(2)
        )

    const caixagrande = Emojis.get('caixagrande') || Emojis.get('caixagrande') || '';

    const containerContent = res.main(
        { type: 10, content: `-# Painel > Sistema de Vendas` },
        { type: 14 },
        { type: 10, content: `${getSaudacao()} Senhor(a) **${interaction.user.username}**, aqui você pode configurar e gerenciar todos os produtos de sua loja!` },
        { type: 14 },
        { type: 10, content: `> ${caixagrande} **Produtos Criados:** \`${ggg.length}\`` },
        { type: 14 },
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: "gerenciar_produtos_menu",
                placeholder: "Selecione uma opção",
                options: [
                    { label: "Criar Produto", description: "Criar um novo produto na loja", value: "criarrrr", emoji: { id: "1178067873894236311" } },
                    { label: "Gerenciar Produtos", description: "Gerenciar produtos existentes", value: "gerenciarotemae", emoji: { id: "1178067945855910078" } },
                    { label: "Cargos Rank", description: "Configurar cargos de ranking", value: "gerenciarposicao", emoji: { id: "1178086608004722689" } },
                    { label: "Painel de Solicitar Stock", description: "Configurar painel de solicitação de estoque", value: "painel-solicitar-stock", emoji: { id: "1459316241490776197" } },
                    { label: "Sistema de Saldo", description: "Em desenvolvimento", value: "sistemasaldo", emoji: { id: "1459050684824682517" } },
                    { label: "Sistema de Afiliado", description: "Em desenvolvimento", value: "sistemaafiliado", emoji: { id: "1459050649244401745" } }
                ]
            }]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    try {
        if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate().catch(() => {});
        await interaction.editReply(containerContent);
    } catch (e) {
        try { await interaction.followUp({ content: `${Emojis.get('negative')||''} Erro ao abrir painel de vendas.`, flags: [64] }); } catch {}
    }
}

module.exports = { Painel, Gerenciar2 }
