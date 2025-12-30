"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const moneyRequestSchema = new mongoose_1.Schema({
    wallet_amount: {
        type: String,
    },
    requested_amount: {
        type: String,
    },
    payment_status: {
        type: String,
        enum: ["requested", "pending", "approved"],
        default: "requested"
    },
    trainer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
}, { timestamps: true });
const report = (0, mongoose_1.model)(tables_1.Tables.trainer_money_request, moneyRequestSchema);
exports.default = report;
//# sourceMappingURL=money_withdraw.schema.js.map