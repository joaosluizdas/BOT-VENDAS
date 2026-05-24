const { createContainer, isAttachment, withProperties } = require("@magicyan/discord");
const { MessageFlags } = require("discord.js");

const constants = {
    colors: {
        main: "#2f3136",
        green: "#2f3136",
        red: "#2f3136",
    }
};

const res = Object.entries(constants.colors)
    .reduce((acc, [key, color]) => ({
        ...acc, [key]: function(...components) {
            const container = createContainer(color, components.filter(c => c !== undefined && c !== null));
            const files = components.filter(isAttachment);
            
            const defaults = {
                content: null,
                files,
                flags: [MessageFlags.IsComponentsV2], 
                components: [container],
                embeds: [],
            };

            const withFunc = (options) => {
                const newOptions = { ...options };
                if (newOptions.flags && Array.isArray(newOptions.flags)) {
                    newOptions.flags = Array.from(new Set([
                        MessageFlags.IsComponentsV2,
                        ...newOptions.flags
                    ]));
                }
                if (newOptions.files && Array.isArray(newOptions.files)) {
                    newOptions.files = [...files, ...newOptions.files];
                }
                if (newOptions.components && Array.isArray(newOptions.components)) {
                    newOptions.components = [container, ...newOptions.components];
                }
                
                const result = { ...defaults, ...newOptions };
                result.content = null;
                return result;
            }
            
            return withProperties(defaults, { with: withFunc });
        }
    }), {});


function container(color, ...components) {
    const containerObj = createContainer(color || "#2f3136", components.filter(c => c !== undefined && c !== null));
    const files = components.filter(isAttachment);
    
    return {
        files,
        flags: MessageFlags.IsComponentsV2,
        components: [containerObj],
        embeds: [],
    };
}


function containerEphemeral(color, ...components) {
    const containerObj = createContainer(color || "#2f3136", components.filter(c => c !== undefined && c !== null));
    const files = components.filter(isAttachment);
    
    return {
        files,
        flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
        components: [containerObj],
        embeds: [],
    };
}

module.exports = { res, container, containerEphemeral };