"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const authEnum_1 = require("../modules/auth/authEnum");
const userSchema = new mongoose_1.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        select: false, // This line excludes password from toJSON output
    },
    mobile_no: {
        type: String,
    },
    account_type: {
        type: String,
        enum: authEnum_1.AccountType,
    },
    login_type: {
        type: String,
        enum: authEnum_1.LoginType,
        default: authEnum_1.LoginType.DEFAULT,
    },
    profile_picture: {
        type: String,
        // default: "https://netquix-ui.vercel.app/user.jpg",
    },
    category: {
        type: String,
    },
    wallet_amount: {
        type: Number,
        default: 0,
    },
    extraInfo: {
        type: Object,
        default: {},
    },
    commission: {
        type: String,
    },
    is_registered_with_stript: { type: Boolean, default: false },
    is_kyc_completed: { type: Boolean, default: false },
    stripe_account_id: {
        type: String,
    },
    subscriptionId: {
        type: String,
        default: null
    }
}, { timestamps: true });
// Add the toJSON method to the schema
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
const user = (0, mongoose_1.model)(tables_1.Tables.user, userSchema);
exports.default = user;
//# sourceMappingURL=user.schema.js.map