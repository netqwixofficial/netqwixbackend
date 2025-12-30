"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateFormat = void 0;
const moment = require("moment");
class DateFormat {
    static addMinutes(date, minutes, format) {
        return moment(date).add(minutes, "minutes").format(format);
    }
}
exports.DateFormat = DateFormat;
//# sourceMappingURL=dateFormat.js.map