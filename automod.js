export class AntiSpam {
    constructor(options = {}) {
        this.messageCache = new Map();
        this.spamThreshold = options.spamThreshold || 5;
        this.spamTimeWindow = options.spamTimeWindow || 5000;
        this.duplicateThreshold = options.duplicateThreshold || 3;
        this.muteOnSpam = options.muteOnSpam || true;
        this.muteDuration = options.muteDuration || "10m";
        this.warningCache = new Map();
    }

    checkMessage(userId, message) {
        const now = Date.now();

        if (!this.messageCache.has(userId)) {
            this.messageCache.set(userId, []);
        }

        const userMessages = this.messageCache.get(userId);

        const recentMessages = userMessages.filter(
            msg => now - msg.timestamp < this.spamTimeWindow
        );

        recentMessages.push({
            timestamp: now,
            content: message.content
        });

        this.messageCache.set(userId, recentMessages);

        if (recentMessages.length >= this.spamThreshold) {
            return {
                isSpam: true,
                reason: "message_flood",
                count: recentMessages.length
            };
        }

        const duplicates = recentMessages.filter(
            msg => msg.content === message.content
        );

        if (duplicates.length >= this.duplicateThreshold) {
            return {
                isSpam: true,
                reason: "duplicate_messages",
                count: duplicates.length
            };
        }

        return { isSpam: false };
    }

    clearUserCache(userId) {
        this.messageCache.delete(userId);
        this.warningCache.delete(userId);
    }

    cleanup() {
        const now = Date.now();
        const timeout = this.spamTimeWindow * 2;

        for (const [userId, messages] of this.messageCache.entries()) {
            const recent = messages.filter(msg => now - msg.timestamp < timeout);
            if (recent.length === 0) {
                this.messageCache.delete(userId);
            } else {
                this.messageCache.set(userId, recent);
            }
        }
    }
}

export class BadWordFilter {
    constructor(bannedWords = []) {
        this.bannedWords = new Set(bannedWords.map(w => w.toLowerCase()));
        this.patterns = [];
        this.action = "delete";
    }

    addWord(word) {
        this.bannedWords.add(word.toLowerCase());
    }

    removeWord(word) {
        this.bannedWords.delete(word.toLowerCase());
    }

    addPattern(pattern) {
        try {
            this.patterns.push(new RegExp(pattern, 'i'));
        } catch (e) {
            console.error("Invalid regex pattern:", pattern);
        }
    }

    check(message) {
        const content = message.content.toLowerCase();
        const words = content.split(/\s+/);

        for (const word of words) {
            if (this.bannedWords.has(word)) {
                return {
                    filtered: true,
                    reason: "banned_word",
                    word: word
                };
            }
        }

        for (const pattern of this.patterns) {
            if (pattern.test(content)) {
                return {
                    filtered: true,
                    reason: "matched_pattern",
                    pattern: pattern.source
                };
            }
        }

        return { filtered: false };
    }
}

export class AutoMod {
    constructor(options = {}) {
        this.antiSpam = new AntiSpam(options.antiSpam);
        this.badWordFilter = new BadWordFilter(options.bannedWords);
        this.enabled = options.enabled !== false;
        this.exemptRoles = new Set(options.exemptRoles || []);
        this.logChannel = options.logChannel || null;
    }

    async processMessage(message, client) {
        if (!this.enabled) return { action: "none" };
        if (message.author?.bot) return { action: "none" };
        if (!message.server) return { action: "none" };

        try {
            const member = await message.server.fetchMember(message.author.id);
            if (member?.roles) {
                for (const roleId of member.roles) {
                    if (this.exemptRoles.has(roleId)) {
                        return { action: "none", reason: "exempt_role" };
                    }
                }
            }
        } catch (e) {
            console.error("Error checking roles:", e);
        }

        const spamCheck = this.antiSpam.checkMessage(message.author.id, message);
        if (spamCheck.isSpam) {
            return {
                action: "spam_detected",
                reason: spamCheck.reason,
                count: spamCheck.count
            };
        }

        const filterCheck = this.badWordFilter.check(message);
        if (filterCheck.filtered) {
            return {
                action: "bad_word_detected",
                reason: filterCheck.reason,
                word: filterCheck.word
            };
        }

        return { action: "none" };
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    addExemptRole(roleId) {
        this.exemptRoles.add(roleId);
    }

    removeExemptRole(roleId) {
        this.exemptRoles.delete(roleId);
    }
}

export class ModerationLog {
    constructor(options = {}) {
        this.logs = [];
        this.maxLogs = options.maxLogs || 1000;
    }

    add(entry) {
        this.logs.push({
            ...entry,
            timestamp: Date.now(),
            id: this.generateId()
        });

        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    get(userId = null, action = null, limit = 50) {
        let filtered = this.logs;

        if (userId) {
            filtered = filtered.filter(log =>
                log.targetId === userId || log.moderatorId === userId
            );
        }

        if (action) {
            filtered = filtered.filter(log => log.action === action);
        }

        return filtered.slice(-limit).reverse();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    clear() {
        this.logs = [];
    }
}

export class RateLimiter {
    constructor(options = {}) {
        this.limits = new Map();
        this.defaultLimit = options.defaultLimit || 5;
        this.defaultWindow = options.defaultWindow || 10000; // 10 seconds
    }

    check(userId, command = "default") {
        const key = `${userId}:${command}`;
        const now = Date.now();

        if (!this.limits.has(key)) {
            this.limits.set(key, []);
        }

        const timestamps = this.limits.get(key);
        const recent = timestamps.filter(ts => now - ts < this.defaultWindow);

        if (recent.length >= this.defaultLimit) {
            return {
                limited: true,
                retryAfter: Math.ceil((recent[0] + this.defaultWindow - now) / 1000)
            };
        }

        recent.push(now);
        this.limits.set(key, recent);

        return { limited: false };
    }

    clear(userId, command = null) {
        if (command) {
            this.limits.delete(`${userId}:${command}`);
        } else {
            for (const key of this.limits.keys()) {
                if (key.startsWith(`${userId}:`)) {
                    this.limits.delete(key);
                }
            }
        }
    }

    cleanup() {
        const now = Date.now();
        const timeout = this.defaultWindow * 2;

        for (const [key, timestamps] of this.limits.entries()) {
            const recent = timestamps.filter(ts => now - ts < timeout);
            if (recent.length === 0) {
                this.limits.delete(key);
            } else {
                this.limits.set(key, recent);
            }
        }
    }
}

export function parseDuration(durationStr) {
    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;

    const amount = parseInt(match[1]);
    const unit = match[2];
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}

export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;

    return `${seconds}s`;
}
