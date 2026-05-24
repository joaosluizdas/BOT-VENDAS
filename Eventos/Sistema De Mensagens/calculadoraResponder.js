const { JsonDatabase } = require("wio.db");
const { AttachmentBuilder } = require("discord.js");

const calcConfig = new JsonDatabase({ databasePath: "./DataBaseJson/calculadoraConfig.json" });

module.exports = {
    name: 'messageCreate',

    run: async (message, client) => {
        if (message.author.bot) return;

        const status = calcConfig.get('status');
        const canal = calcConfig.get('canal');

        if (!status || !canal) return;
        if (message.channel.id !== canal) return;

        // Detectar se a mensagem é um número (com ou sem formatação como 1.500 ou 1,500)
        const textoLimpo = message.content.trim().replace(/[.,\s]/g, '');
        const numero = parseInt(textoLimpo);

        if (isNaN(numero) || numero <= 0 || numero > 2000000) return;
        if (textoLimpo.length === 0 || !/^\d+$/.test(textoLimpo)) return;

        try {
            const { gerarImagemCalculadora, calcularPrecos } = require("../../Functions/CalculadoraRobux");
            const { JsonDatabase: JDB } = require("wio.db");
            const robuxConfig = new JDB({ databasePath: "./DataBaseJson/configuracaorobux.json" });

            const calculos = calcularPrecos(numero, robuxConfig);
            const imageBuffer = await gerarImagemCalculadora(numero, calculos, message.guild);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'calculadora-robux.png' });

            await message.reply({ files: [attachment] }).catch(() => {
                message.channel.send({ files: [attachment] }).catch(() => {});
            });
        } catch (e) {
            // Silently ignore errors in auto-detection
        }
    }
};
