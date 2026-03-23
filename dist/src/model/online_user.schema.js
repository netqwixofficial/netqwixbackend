"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const onlineUserSchema = new mongoose_1.Schema({
    trainer_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users", unique: true },
    last_activity_time: { type: Date },
}, { timestamps: true });
const onlineUser = (0, mongoose_1.model)(tables_1.Tables.online_user, onlineUserSchema);
exports.default = onlineUser;
//# sourceMappingURL=online_user.schema.js.map