import { config } from "../config.js";
import { rateLimiter } from "../utils/ratelimit.js";

import { handleHelp } from "./help.js";
import { handleKick, handleBan, handleUnban } from "./moderation.js";
import { handleWarn, handleWarnings, handleClearWarnings } from "./warnings.js";
import { handleMute, handleUnmute } from "./mute.js";
import { handlePurge, handleSlowmode, handleLockdown } from "./channel.js";
import { handleInfo, handleServerInfo } from "./info.js";

export async function handleCommand(message, client) {
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (config.rateLimiting.enabled) {
        const rateLimitCheck = rateLimiter.check(message.author.id, command);
        if (rateLimitCheck.limited) {
            const msg = config.messages.rateLimited.replace("{time}", rateLimitCheck.retryAfter);
            await message.reply(msg);
            return;
        }
    }

    let member = null;
    if (message.server) {
        try {
            member = await message.server.fetchMember(message.author.id);
        } catch (e) {
            console.error("Could not fetch member:", e);
        }
    }

    // This is ugly but there isn't better alternative
    try {
        switch (command) {
            case "help":
                await handleHelp(message);
                break;

            case "kick":
                if (!config.features.kick) return;
                await handleKick(message, args, member);
                break;

            case "ban":
                if (!config.features.ban) return;
                await handleBan(message, args, member);
                break;

            case "unban":
                if (!config.features.ban) return;
                await handleUnban(message, args, member);
                break;

            case "warn":
                if (!config.features.warnings) return;
                await handleWarn(message, args, member);
                break;

            case "warnings":
                if (!config.features.warnings) return;
                await handleWarnings(message, args);
                break;

            case "clearwarnings":
                if (!config.features.warnings) return;
                await handleClearWarnings(message, args, member);
                break;

            case "mute":
                if (!config.features.mute) return;
                await handleMute(message, args, member);
                break;

            case "unmute":
                if (!config.features.mute) return;
                await handleUnmute(message, args, member);
                break;

            case "purge":
                if (!config.features.purge) return;
                await handlePurge(message, args, member);
                break;

            case "slowmode":
                if (!config.features.slowmode) return;
                await handleSlowmode(message, args, member);
                break;

            case "lockdown":
                if (!config.features.lockdown) return;
                await handleLockdown(message, args, member);
                break;

            case "info":
            case "userinfo":
                await handleInfo(message, args);
                break;

            case "serverinfo":
                await handleServerInfo(message);
                break;

            case "setupreactionroles":
            case "reactionroles":
                await handleSetupReactionRoles(message, args, member);
                break;

            case "removereactionrole":
                await handleRemoveReactionRole(message, args, member);
                break;

            case "listreactionroles":
                await handleListReactionRoles(message, args, member);
                break;

            case "rolemap":
                await handleUpdateRoleMap(message, args, member);
                break;

            default:
                break;
        }
    } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        await message.reply(config.messages.error);
    }
}
