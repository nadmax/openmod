import { config } from "../config.js";

class RateLimiter {
    constructor(options = {}) {
        this.limits = new Map();
        this.defaultLimit = options.defaultLimit || config.rateLimiting.defaultLimit;
        this.defaultWindow = options.defaultWindow || config.rateLimiting.defaultWindow;
    }

    check(userId, command = "default") {
        if (!config.rateLimiting.enabled) {
            return { limited: false };
        }

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

export const rateLimiter = new RateLimiter();

setInterval(() => {
    rateLimiter.cleanup();
}, 60 * 1000);

export default rateLimiter;
