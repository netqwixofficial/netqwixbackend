"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const reportSchema = new mongoose_1.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    reportData: {
        type: Array
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
    status: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });
const report = (0, mongoose_1.model)(tables_1.Tables.report, reportSchema);
exports.default = report;
//# sourceMappingURL=report.schema.js.map