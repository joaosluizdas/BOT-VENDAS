const { configuracao, Emojis } = require("../../DataBaseJson");
const { ModalBuilder, TextInputBuilder, ButtonBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { res } = require("../../res");
const fs = require("fs");
const path = require("path");
const https = require("https");
const axios = require("axios");

async function EfiBank(interaction) {
    const sistema = configuracao.get(`pagamentos.sistema_efi`) ? "🟢 Habilitado" : "🔴 Desabilitado";
    
    const secretToken = configuracao.get("pagamentos.secret_token");
    const secretId = configuracao.get("pagamentos.secret_id");
    
    let statusMessage;
    if (secretToken && secretId) {
        statusMessage = "🟢 Ambos configurados!";
    } else if (secretToken) {
        statusMessage = "🟢 Secret Token configurado";
    } else if (secretId) {
        statusMessage = "🟢 Secret ID configurado";
    } else {
        statusMessage = "❌ Nenhum dos dois configurados.";
    }

    const rowVoltar = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setStyle(2)
            .setCustomId(`formasdepagamentos`)
            .setLabel(`Voltar`)
            .setEmoji(Emojis.get(`_back_emoji`) || '🔙')
    );

    const containerContent = res.main(
        { type: 10, content: `**${Emojis.get('efi') || '🏦'} ${interaction.user.globalName} - EfiBank**` },
        { type: 14 },
        { type: 10, content: `Aqui, você pode configurar tudo referente ao Efi Bank. Pode definir ou redefinir suas credenciais, habilitar ou desabilitar o sistema de pagamentos.` },
        { type: 14 },
        { type: 10, content: `> **Status do Sistema:** \`${sistema}\`\n> **Credenciais:** \`${statusMessage}\`` },
        { type: 14 },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 2,
                    label: "Alterar Credenciais",
                    custom_id: "config_pagamentos_secretconfig",
                    emoji: Emojis.get('_lapis_emoji') ? { id: Emojis.get('_lapis_emoji').match(/\d+/)?.[0] } : { name: "✏️" }
                },
                {
                    type: 2,
                    style: configuracao.get(`pagamentos.sistema_efi`) ? 3 : 4,
                    label: configuracao.get(`pagamentos.sistema_efi`) ? "Desabilitar" : "Habilitar",
                    custom_id: "config_pagamentos_efi_sistema",
                    emoji: { id: "1449033137098068030" }
                }
            ]
        }
    ).with({
        components: [rowVoltar],
        flags: [64]
    });

    await interaction.update(containerContent);
}

module.exports = {
    name: "interactionCreate",
    run: async (interaction, client) => {
        const { customId } = interaction;
        if (!customId) return;

        if (interaction.customId === "config_pagamentos_efi_sistema") {
            configuracao.set("pagamentos.sistema_efi", !configuracao.get(`pagamentos.sistema_efi`) || false);
            EfiBank(interaction);
        }
    
        if (interaction.customId === `config_pagamentos_secretconfig`) {
            const modal = new ModalBuilder()
                .setCustomId(`alterarcredenciais`)
                .setTitle(`Credenciais Efi Bank`);

            const clientid = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("clientid")
                    .setLabel("CLIENT ID")
                    .setPlaceholder("Client_id_XxxXxXx")
                    .setValue(`${configuracao.get(`pagamentos.secret_id`) || ""}`)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            );

            const clientsecret = new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId("clientsecret")
                    .setLabel("CLIENT SECRET")
                    .setPlaceholder("Client_secret_XxxXxXx")
                    .setValue(`${configuracao.get(`pagamentos.secret_token`) || ""}`)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short)
            );

            modal.addComponents(clientid, clientsecret);
            await interaction.showModal(modal);
        }
    
        if (interaction.customId === `config_pagamentos_efibank`) {
            EfiBank(interaction);
        }

        if (interaction.customId === `alterarcredenciais`) {
            const clientid = interaction.fields.getTextInputValue("clientid");
            const clientsecret = interaction.fields.getTextInputValue("clientsecret");
    
            await interaction.reply({
                content: `${Emojis.get(`checker`)} 50% do processo já concluído, agora envie o certificado .p12.`,
                ephemeral: true
            });
    
            const filter = (msg) => {
                if (msg.author.id !== interaction.user.id) return false;
                if (!msg.attachments.size) return false;
                const file = msg.attachments.first();
                return file.name.toLowerCase().endsWith('.p12');
            };
    
            try {
                const collected = await interaction.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 60000,
                    errors: ['time']
                });
    
                const msg = collected.first();
                const file = msg.attachments.first();
                const libPath = path.join(__dirname, '..', '..', 'Lib');
                
                if (!fs.existsSync(libPath)) {
                    fs.mkdirSync(libPath, { recursive: true });
                }
    
                const certificateName = file.name.replace('.p12', '');
                const certificatePath = path.join(libPath, file.name);
    
                const response = await axios.get(file.url, { 
                    responseType: 'arraybuffer',
                    headers: { 'Accept': 'application/octet-stream' }
                });
    
                fs.writeFileSync(certificatePath, Buffer.from(response.data));
                const certificadoBuffer = fs.readFileSync(certificatePath);
                const authData = Buffer.from(`${clientid}:${clientsecret}`).toString("base64");
                const agent = new https.Agent({ pfx: certificadoBuffer, passphrase: "" });
    
                const tokenResponse = await axios.post(
                    "https://pix.api.efipay.com.br/oauth/token",
                    { grant_type: "client_credentials" },
                    {
                        headers: {
                            Authorization: `Basic ${authData}`,
                            "Content-Type": "application/json",
                        },
                        httpsAgent: agent,
                    }
                );
    
                const access_token = tokenResponse.data.access_token;
                const chavesPixResponse = await axios.get("https://pix.api.efipay.com.br/v2/gn/evp", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    httpsAgent: agent,
                });
    
                let chavepix = '';
                if (chavesPixResponse.data.chaves.length < 1) {
                    const novaChaveResponse = await axios.post("https://pix.api.efipay.com.br/v2/gn/evp", {}, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            "Content-Type": "application/json",
                        },
                        httpsAgent: agent,
                    });
                    chavepix = novaChaveResponse.data.chave;
                } else {
                    chavepix = chavesPixResponse.data.chaves[0];
                }
    
                configuracao.set(`pagamentos.certificado`, certificateName);
                configuracao.set(`pagamentos.secret_id`, clientid);
                configuracao.set(`pagamentos.chavepix`, chavepix);
                configuracao.set(`pagamentos.secret_token`, clientsecret);
    
                await msg.delete().catch(() => {});
    
                await interaction.editReply({
                    content: `${Emojis.get(`checker`)} Configuração concluída com sucesso!`,
                    ephemeral: true
                });
    
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('time')) {
                    await interaction.editReply({
                        content: `${Emojis.get(`negative`)} Tempo esgotado. Por favor, tente novamente.`,
                        ephemeral: true
                    });
                    return;
                }
                console.log(error);
                await interaction.editReply({
                    content: `${Emojis.get(`negative`)} Ocorreu um erro, as credenciais provavelmente estão inválidas, Veja o [Tutorial](https://www.youtube.com/watch?v=phi1GmiQuXM) a seguir`,
                    ephemeral: true
                });
            }
        }
    },
};
