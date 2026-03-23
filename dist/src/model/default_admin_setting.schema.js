"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const adminSettingSchema = new mongoose_1.Schema({
    commission: {
        type: Number,
        default: 5,
    },
    last_updated_admin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
}, { timestamps: true });
const admin_setting = (0, mongoose_1.model)(tables_1.Tables.admin_setting, adminSettingSchema);
exports.default = admin_setting;
//# sourceMappingURL=default_admin_setting.schema.js.map