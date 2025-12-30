"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseInit = void 0;
const logger_1 = require("./../../logger");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();
class DatabaseInit {
    constructor() {
        // connection for database
        this.log = logger_1.log.getLogger();
        // uncomment below line to connect DB
        this.connectDatabase();
    }
    async connectDatabase() {
        try {
            const url = this.getConnectURL();
            // WRITE MONGO CONNECT
            mongoose.connect(url);
            this.log.info("Database connected successfully");
        }
        catch (err) {
            this.log.error(`mongo Connection error ---- `, err);
        }
    }
    getConnectURL() {
        const url = process.env.MONGO_URL;
        return url;
    }
}
exports.DatabaseInit = DatabaseInit;
//# sourceMappingURL=database.js.map