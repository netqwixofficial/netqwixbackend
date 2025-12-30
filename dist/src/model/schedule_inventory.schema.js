"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const scheduleInventorySchema = new mongoose_1.Schema({
    trainer_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "users",
    },
    available_slots: [
        {
            day: { type: String },
            slots: [
                new mongoose_1.Schema({
                    start_time: String,
                    end_time: String,
                }),
            ],
        },
    ],
}, { timestamps: true });
const schedule_inventory = (0, mongoose_1.model)(tables_1.Tables.schedule_inventory, scheduleInventorySchema);
exports.default = schedule_inventory;
//# sourceMappingURL=schedule_inventory.schema.js.map