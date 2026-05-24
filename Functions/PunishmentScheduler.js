/**
 * PunishmentScheduler.js
 * Sistema de punições temporárias persistentes.
 * Salva expiry no banco JSON e reagenda automaticamente ao reiniciar o bot.
 *
 * DB Keys (SystemMod):
 *   punishments.tempban.{userId}_{guildId}  → { userId, guildId, type, expiresAt, reason }
 *   punishments.mute.{userId}_{guildId}     → { userId, guildId, type, expiresAt, reason }
 */

const { SystemMod } = require('../DataBaseJson');

const activeTimers = new Map(); // key → timeoutId

function punishmentKey(type, userId, guildId) {
    return `punishments.${type}.${userId}_${guildId}`;
}

/**
 * Agenda uma punição temporária no banco e cria o setTimeout.
 * @param {object} opts - { client, type: 'tempban'|'mute', userId, guildId, expiresAt, reason }
 */
function schedulePunishment(opts) {
    const { client, type, userId, guildId, expiresAt, reason } = opts;
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;

    SystemMod.set(key, { userId, guildId, type, expiresAt, reason, savedAt: Date.now() });

    const delay = Math.max(expiresAt - Date.now(), 0);

    if (activeTimers.has(timerKey)) clearTimeout(activeTimers.get(timerKey));

    const tid = setTimeout(() => executePunishmentRemoval({ client, type, userId, guildId }), delay);
    activeTimers.set(timerKey, tid);
}

/**
 * Executa a remoção da punição (unban ou un-timeout).
 */
async function executePunishmentRemoval({ client, type, userId, guildId }) {
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;
    activeTimers.delete(timerKey);

    try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return;

        if (type === 'tempban') {
            await guild.members.unban(userId, 'TempBan expirado automaticamente').catch(() => {});
        } else if (type === 'mute') {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member) await member.timeout(null, 'TempMute expirado automaticamente').catch(() => {});
        }

        const logCanalId = require('./').configuracao?.get?.('moderacao.logCanal');
        if (logCanalId) {
            try {
                const ch = await client.channels.fetch(logCanalId);
                if (ch) {
                    const { res } = require('../res');
                    const label = type === 'tempban' ? 'Ban Temporário Expirou' : 'Mute Temporário Expirou';
                    await ch.send(res.main(
                        { type: 10, content: `-# Moderação > Punição Automática` },
                        { type: 14 },
                        { type: 10, content: `### ✅ ${label}\n> **Usuário:** <@${userId}> (\`${userId}\`)\n> **Punição:** \`${type}\` removida automaticamente` }
                    ));
                }
            } catch {}
        }
    } catch (err) {
        console.error(`[PunishmentScheduler] Erro ao remover ${type} de ${userId}:`, err.message);
    } finally {
        SystemMod.delete(key);
    }
}

/**
 * Carrega todas as punições pendentes do banco e reagenda seus timers.
 * Deve ser chamado no evento ready do bot.
 */
async function loadAndSchedule(client) {
    let loaded = 0;
    const types = ['tempban', 'mute'];

    for (const type of types) {
        const allOfType = SystemMod.get(`punishments.${type}`) || {};
        for (const [entryKey, entry] of Object.entries(allOfType)) {
            if (!entry || !entry.userId || !entry.guildId || !entry.expiresAt) continue;
            const { userId, guildId, reason, expiresAt } = entry;

            if (Date.now() >= expiresAt) {
                await executePunishmentRemoval({ client, type, userId, guildId });
            } else {
                schedulePunishment({ client, type, userId, guildId, expiresAt, reason });
                loaded++;
            }
        }
    }

    if (loaded > 0) console.log(`\x1b[36m[PunishmentScheduler]\x1b[35m ${loaded} punição(ões) temporária(s) reagendada(s).`);
}

/**
 * Cancela uma punição agendada (ex: ao fazer unban manual).
 */
function cancelPunishment(type, userId, guildId) {
    const key = punishmentKey(type, userId, guildId);
    const timerKey = `${type}:${userId}:${guildId}`;
    if (activeTimers.has(timerKey)) {
        clearTimeout(activeTimers.get(timerKey));
        activeTimers.delete(timerKey);
    }
    SystemMod.delete(key);
}

module.exports = { schedulePunishment, cancelPunishment, loadAndSchedule };
