"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
// Create the referred user schema
const referredUserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    referrerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: tables_1.Tables.user,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);
// Define the toJSON method if needed
referredUserSchema.methods.toJSON = function () {
    const referredUserObject = this.toObject();
    return referredUserObject;
};
// Create the model using the IReferredUser interface
const ReferredUser = (0, mongoose_1.model)(tables_1.Tables.referredUser, referredUserSchema);
exports.default = ReferredUser;
//# sourceMappingURL=referred.user.schema.js.map