"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const winston_1 = require("winston");
const { combine, timestamp, prettyPrint, colorize } = winston_1.format;
//  level: "debug",
//       transports: [new transports.Console()],
class log {
    static getLogger() {
        return (0, winston_1.createLogger)({
            format: combine(
            //    timestamp({})
            prettyPrint(), colorize()),
            level: "debug",
            transports: [new winston_1.transports.Console()]
        });
    }
}
exports.log = log;
//# sourceMappingURL=logger.js.map