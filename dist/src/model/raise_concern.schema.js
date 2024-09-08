"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const raiseConcernSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    booking_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "booked_sessions",
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
    reason: {
        type: String,
    },
    is_releted_to_refund: {
        type: String,
    },
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
const raise_concern = (0, mongoose_1.model)(tables_1.Tables.raise_concern, raiseConcernSchema);
exports.default = raise_concern;
//# sourceMappingURL=raise_concern.schema.js.map