"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const notificationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
    },
    receiverId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "user",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
const notification = (0, mongoose_1.model)(tables_1.Tables.notifications, notificationSchema);
exports.default = notification;
//# sourceMappingURL=notifications.schema.js.map