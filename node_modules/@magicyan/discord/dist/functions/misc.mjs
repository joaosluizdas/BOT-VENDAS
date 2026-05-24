import { DefaultWebSocketManagerOptions } from 'discord.js';

function setMobileStatus() {
  Object.assign(DefaultWebSocketManagerOptions.identifyProperties, {
    browser: "Discord Android"
  });
}

export { setMobileStatus };
