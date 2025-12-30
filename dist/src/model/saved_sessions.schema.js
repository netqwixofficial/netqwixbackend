"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const savedSessionsSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    file_name: {
        type: String,
        default: ""
    },
    file_type: {
        type: String,
    },
    file_id: {
        type: String,
    },
    sessions: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "booked_sessions",
    },
    trainer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
    trainee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
    trainee_name: {
        type: String,
    },
    trainer_name: {
        type: String,
    },
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
const saved_session = (0, mongoose_1.model)(tables_1.Tables.saved_session, savedSessionsSchema);
exports.default = saved_session;
//# sourceMappingURL=saved_sessions.schema.js.map