"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const writeUSSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone_number: {
        type: String,
    },
    // reason: {
    //     type: String,
    // },
    description: {
        type: String,
    },
    subject: {
        type: String,
    },
    ticket_status: {
        type: String,
        default: "open"
    },
}, { timestamps: true });
const write_us = (0, mongoose_1.model)(tables_1.Tables.write_us, writeUSSchema);
exports.default = write_us;
//# sourceMappingURL=write_us.schema.js.map