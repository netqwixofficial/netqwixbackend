"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemCache = void 0;
const logger_1 = require("../../logger");
class MemCache {
    static setDetail(set, key, val) {
        if (!this.memCache[set]) {
            this.memCache[set] = {};
        }
        this.memCache[set][key] = val;
        // this.logger.debug(`*inMemory* hset: ${set} :: ${key} :: ${val}`);
    }
    static getDetail(set, key) {
        let val = null;
        if (this.memCache[set] && this.memCache[set][key]) {
            val = this.memCache[set][key];
        }
        // this.logger.debug(`*inMemory* hget: ${set} :: ${key} :: ${val}`);
        return val;
    }
    static deleteDetail(set, key) {
        if (this.memCache[set] && this.memCache[set][key]) {
            delete this.memCache[set][key];
        }
        // this.logger.debug(`*inMemory* hdel: ${set} :: ${key}`);
    }
    static getAll() {
        return this.memCache;
    }
}
exports.MemCache = MemCache;
MemCache.logger = logger_1.log.getLogger();
MemCache.memCache = {};
//# sourceMappingURL=memCache.js.map