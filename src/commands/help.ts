import { config } from "../config.js";

export async function handleHelp(message) {
    const prefix = config.prefix;

    let helpText = `**Moderation Bot Commands**\n\n`;

    if (config.features.kick || config.features.ban || config.features.warnings || config.features.mute) {
        helpText += `**Moderation:**\n`;

        if (config.features.kick) {
            helpText += `\`${prefix}kick @user [reason]\` - Kick a user from the server\n`;
        }

        if (config.features.ban) {
            helpText += `\`${prefix}ban @user [reason]\` - Ban a user from the server\n`;
            helpText += `\`${prefix}unban <user_id>\` - Unban a user\n`;
        }

        if (config.features.warnings) {
            helpText += `\`${prefix}warn @user <reason>\` - Warn a user\n`;
            helpText += `\`${prefix}warnings [@user]\` - View warnings for a user\n`;
            helpText += `\`${prefix}clearwarnings @user\` - Clear all warnings for a user\n`;
        }

        if (config.features.mute) {
            helpText += `\`${prefix}mute @user <duration> [reason]\` - Mute a user (e.g., 10m, 1h, 1d)\n`;
            helpText += `\`${prefix}unmute @user\` - Unmute a user\n`;
        }

        helpText += `\n`;
    }

    if (config.features.purge || config.features.slowmode || config.features.lockdown) {
        helpText += `**Channel Management:**\n`;

        if (config.features.purge) {
            helpText += `\`${prefix}purge <amount>\` - Delete multiple messages (max 100)\n`;
        }

        if (config.features.slowmode) {
            helpText += `\`${prefix}slowmode <seconds>\` - Set slowmode for channel (0 to disable)\n`;
        }

        if (config.features.lockdown) {
            helpText += `\`${prefix}lockdown\` - Lock/unlock the current channel\n`;
        }

        helpText += `\n`;
    }

    helpText += `**Information:**\n`;
    helpText += `\`${prefix}info [@user]\` - Get user information\n`;
    helpText += `\`${prefix}serverinfo\` - Get server information\n`;
    helpText += `\`${prefix}help\` - Show this help message\n`;

    helpText += `**Reaction Roles:**\n`;
    helpText += `\`${prefix}setupreactionroles\` - Create a reaction role message\n`;
    helpText += `\`${prefix}listreactionroles\` - List all reaction role messages\n`;
    helpText += `\`${prefix}removereactionrole <messageId>\` - Remove a reaction role message\n`;
    helpText += `\`${prefix}rolemap\` - Show emoji to role mapping\n`;

    if (config.autoMod.enabled) {
        helpText += `\n**Auto-Moderation:** ${config.features.antiSpam ? "✅ Anti-Spam" : ""}${config.features.badWordFilter ? " ✅ Bad Word Filter" : ""}`;
    }

    await message.reply(helpText);
}
