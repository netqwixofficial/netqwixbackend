"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const availabilitySchema = new mongoose_1.Schema({
    trainer_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "users" },
    start_time: { type: Date },
    end_time: { type: Date },
    status: { type: Boolean, default: false }
}, { timestamps: true });
const availability = (0, mongoose_1.model)(tables_1.Tables.availability, availabilitySchema);
exports.default = availability;
//# sourceMappingURL=availability.schema.js.map