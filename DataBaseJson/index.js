const {
  JsonDatabase,
} = require("wio.db");
const fs = require('fs');
const path = require('path');


const emojisPath = path.join(__dirname, 'emojis.json');
let emojisCache = null;
let lastEmojisLoad = 0;
const EMOJI_CACHE_TTL = 60000; 

const getEmojis = () => {
  const now = Date.now();
  
  if (!emojisCache || (now - lastEmojisLoad) > EMOJI_CACHE_TTL) {
    try {
      const resolvedPath = require.resolve('./emojis.json');
      const freshData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      if (require.cache[resolvedPath]) {
        const cached = require.cache[resolvedPath].exports;
        Object.keys(cached).forEach(k => delete cached[k]);
        Object.assign(cached, freshData);
        emojisCache = cached;
      } else {
        emojisCache = freshData;
        require.cache[resolvedPath] = { id: resolvedPath, filename: resolvedPath, loaded: true, exports: emojisCache, children: [], paths: [] };
      }
      lastEmojisLoad = now;
    } catch {
      emojisCache = {};
    }
  }
  return emojisCache;
};


const EmojisHelper = {
  get: (name) => {
    const emojis = getEmojis();
    return emojis[name] || "";
  },
  getAll: () => getEmojis(),
  reload: () => {
    emojisCache = null;
    lastEmojisLoad = 0;
    return getEmojis();
  }
};

const produtos = new JsonDatabase({
  databasePath: "./DataBaseJson/produtos.json"
});

const buttons = new JsonDatabase({
  databasePath: "./DataBaseJson/buttons.json"
});

const carrinhos = new JsonDatabase({
  databasePath: "./DataBaseJson/carrinhos.json"
});

const pagamentos = new JsonDatabase({
  databasePath: "./DataBaseJson/pagamentos.json"
});

const pedidos = new JsonDatabase({
  databasePath: "./DataBaseJson/pedidos.json"
});

const estatisticas = new JsonDatabase({
  databasePath: "./DataBaseJson/estatisticas.json"
});

const configuracao = new JsonDatabase({
  databasePath: "./DataBaseJson/configuracao.json"
});

const tickets = new JsonDatabase({
  databasePath: "./DataBaseJson/tickets.json"
});

const perms = new JsonDatabase({
  databasePath: "./DataBaseJson/perms.json"
});

const msgsauto = new JsonDatabase({
  databasePath: "./DataBaseJson/msgsauto.json"
});

const entregaslog = new JsonDatabase({
  databasePath: "./DataBaseJson/entregaslog.json"
});
const SystemMod = new JsonDatabase({
  databasePath: "./DataBaseJson/SystemMod.json"
});
const Temporario = new JsonDatabase({
  databasePath: "./DataBaseJson/Temporario.json"
});
const Convites = new JsonDatabase({
  databasePath: "./DataBaseJson/Convites.json"
});
const GuildsInvites = new JsonDatabase({
  databasePath: "./DataBaseJson/GuildsInvites.json"
});
const Emojis = new JsonDatabase({
  databasePath: "./DataBaseJson/emojis.json"
});
const refounds = new JsonDatabase({
  databasePath: "./DataBaseJson/refounds.json"
});
const Compras = new JsonDatabase({
  databasePath: "./DataBaseJson/Compras.json"
});
const BackupStorage = new JsonDatabase({
  databasePath: "./DataBaseJson/BackupStorage.json"
});

const autolock = new JsonDatabase({
  databasePath: "./DataBaseJson/autolock.json"
});

const configuracaorobux = new JsonDatabase({
  databasePath: "./DataBaseJson/configuracaorobux.json"
});

const mensagemrobux = new JsonDatabase({
  databasePath: "./DataBaseJson/mensagemrobux.json"
});

const carrinhosrobux = new JsonDatabase({
  databasePath: "./DataBaseJson/carrinhosrobux.json"
});

const sorteios = new JsonDatabase({
  databasePath: "./DataBaseJson/sorteios.json"
});

const sugestao = new JsonDatabase({
  databasePath: "./DataBaseJson/sugestao.json"
});

const transcript = new JsonDatabase({
  databasePath: "./DataBaseJson/transcript.json"
});

const giftcards = new JsonDatabase({
  databasePath: "./DataBaseJson/giftcards.json"
});

const gamepassJogos = new JsonDatabase({
  databasePath: "./DataBaseJson/gamepassJogos.json"
});

const stockAutoConfig = new JsonDatabase({
  databasePath: "./DataBaseJson/stockAutoConfig.json"
});

const iaConfig = new JsonDatabase({
  databasePath: "./DataBaseJson/iaConfig.json"
});

module.exports = {
  produtos,
  buttons,
  carrinhos,
  pagamentos,
  pedidos,
  configuracao,
  estatisticas,
  GuildsInvites,
  tickets,
  perms,
  msgsauto,
  entregaslog,
  SystemMod,
  Temporario,
  Convites,
  Emojis,
  EmojisHelper,
  refounds,
  Compras,
  BackupStorage,
  autolock,
  configuracaorobux,
  mensagemrobux,
  carrinhosrobux,
  sorteios,
  sugestao,
  transcript,
  giftcards,
  gamepassJogos,
  stockAutoConfig,
  iaConfig
}
