import { config } from "../config.js";
import { hasPermission } from "../utils/permissions.js";
import {
    addReactionRoleMessage,
    removeReactionRoleMessage,
    getAllReactionRoleMessages,
    emojiRoleMap,
    getRoleNameForEmoji
} from "../utils/reactionroles.js";

export async function handleSetupReactionRoles(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageRoles")) {
        return await message.reply(config.messages.noPermission);
    }

    const reactionRoleText =
        `**🎨 Choose Your Color Role**\n\n` +
        `React to this message with an emoji to get the corresponding role:\n\n` +
        `🌹 **Rose**\n` +
        `🟣 **Violet**\n` +
        `🔵 **Bleu foncé**\n` +
        `📘 **Bleu clair**\n` +
        `🟢 **Vert**\n` +
        `🟡 **Jaune**\n` +
        `🟠 **Orange**\n` +
        `🟤 **Marron**\n` +
        `🔴 **Rouge**\n\n` +
        `*Remove your reaction to remove the role.*`;

    try {
        const roleMessage = await message.channel.sendMessage(reactionRoleText);

        addReactionRoleMessage(roleMessage.id, message.server.id, {
            notifyUsers: true
        });

        const emojis = ["🌹", "🟣", "🔵", "📘", "🟢", "🟡", "🟠", "🟤", "🔴"];
        for (const emoji of emojis) {
            try {
                // Note: revolt.js might not support adding reactions programmatically yet
                // You may need to add reactions manually for now
                // await roleMessage.react(emoji);
            } catch (e) {
                console.log(`Could not add reaction ${emoji}:`, e);
            }
        }

        await message.reply(
            `✅ Reaction role message created! Please manually add the reactions:\n` +
            `🌹 🟣 🔵 📘 🟢 🟡 🟠 🟤 🔴\n\n` +
            `Users can now react to get their color roles!`
        );

    } catch (error) {
        console.error("Error creating reaction role message:", error);
        await message.reply("❌ Failed to create reaction role message.");
    }
}

export async function handleRemoveReactionRole(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageRoles")) {
        return await message.reply(config.messages.noPermission);
    }

    const messageId = args[0];
    if (!messageId) {
        return await message.reply("❌ Please provide a message ID to remove from reaction roles.");
    }

    const removed = removeReactionRoleMessage(messageId);

    if (removed) {
        await message.reply("✅ Reaction role message removed.");
    } else {
        await message.reply("❌ Message not found in reaction role list.");
    }
}

export async function handleListReactionRoles(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    const reactionRoles = getAllReactionRoleMessages();

    if (reactionRoles.length === 0) {
        return await message.reply("No reaction role messages configured.");
    }

    let listText = `**📋 Reaction Role Messages** (${reactionRoles.length} total)\n\n`;

    for (const [messageId, config] of reactionRoles) {
        if (config.serverId === message.server.id) {
            const date = new Date(config.createdAt).toLocaleDateString();
            listText += `**Message ID:** ${messageId}\n`;
            listText += `Created: ${date} | Notify: ${config.notifyUsers ? "Yes" : "No"}\n\n`;
        }
    }

    await message.reply(listText);
}

export async function handleUpdateRoleMap(message, args, member) {
    if (!message.server) {
        return await message.reply(config.messages.serverOnly);
    }

    if (!await hasPermission(member, "ManageRoles")) {
        return await message.reply(config.messages.noPermission);
    }

    let mapText = `**🎨 Current Emoji → Role Mapping**\n\n`;

    for (const [emoji, roleId] of emojiRoleMap.entries()) {
        const roleName = getRoleNameForEmoji(emoji);
        mapText += `${emoji} → **${roleName}** (\`${roleId}\`)\n`;
    }

    mapText += `\n*To update role IDs, edit \`utils/reactionroles.js\`*`;

    await message.reply(mapText);
}
