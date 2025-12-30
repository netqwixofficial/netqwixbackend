"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const masterDataSchema = new mongoose_1.Schema({
    category: {
        type: [String],
        default: ['Golf', 'Tennis']
    },
});
const master_data = (0, mongoose_1.model)(tables_1.Tables.master_data, masterDataSchema);
exports.default = master_data;
//# sourceMappingURL=master_data.js.map