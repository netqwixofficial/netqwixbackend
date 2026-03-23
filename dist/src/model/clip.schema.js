"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const clipSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: false,
    },
    file_name: {
        type: String,
        default: ""
    },
    thumbnail: {
        type: String,
        default: ""
    },
    file_type: {
        type: String,
    },
    file_id: {
        type: String,
    },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
    user_type: {
        type: String,
        enum: ["Trainer", "Trainee", "Admin"],
    },
    status: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });
const clip = (0, mongoose_1.model)(tables_1.Tables.clip, clipSchema);
exports.default = clip;
//# sourceMappingURL=clip.schema.js.map