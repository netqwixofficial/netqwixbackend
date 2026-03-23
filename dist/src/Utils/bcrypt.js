"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bcrypt = void 0;
const bcrypt = require("bcrypt");
class Bcrypt {
    constructor() {
        this.getHashedPassword = async (password) => {
            const salt = await bcrypt.genSalt();
            return await bcrypt.hash(password, salt);
        };
        this.comparePassword = async (loggedInPass, dbPass) => {
            return await bcrypt.compare(loggedInPass, dbPass);
        };
    }
}
exports.Bcrypt = Bcrypt;
//# sourceMappingURL=bcrypt.js.map