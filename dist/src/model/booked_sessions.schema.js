"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const constance_1 = require("../config/constance");
const bookedSessionsSchema = new mongoose_1.Schema({
    trainer_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    trainee_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    status: {
        type: String,
        default: null,
        enum: constance_1.BOOKED_SESSIONS_STATUS,
    },
    booked_date: {
        type: Date,
        default: null,
        required: true,
    },
    session_start_time: {
        type: String,
        default: null,
        required: true,
    },
    session_end_time: {
        type: String,
        default: null,
        required: true,
    },
    start_time: {
        type: Date,
        default: null,
    },
    end_time: {
        type: Date,
        default: null,
    },
    time_zone: {
        type: String,
        default: null,
    },
    session_link: {
        type: String,
        default: null,
    },
    ratings: {
        type: Object,
        default: null,
    },
    report: {
        type: String,
        default: null,
    },
    payment_intent_id: {
        type: String,
        default: null,
    },
    trainee_clip: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "clip"
        }],
    refund_status: {
        type: String,
    },
    amount: {
        type: String,
    },
    application_fee_amount: {
        type: String,
    },
    iceServers: {
        type: mongoose_1.Schema.Types.Array,
        default: [],
    }
}, { timestamps: true });
const booked_session = (0, mongoose_1.model)(tables_1.Tables.booked_sessions, bookedSessionsSchema);
exports.default = booked_session;
//# sourceMappingURL=booked_sessions.schema.js.map