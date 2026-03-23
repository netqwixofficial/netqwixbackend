"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tables_1 = require("../config/tables");
const authEnum_1 = require("../modules/auth/authEnum");
const mongodb_1 = require("mongodb");
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
    },
    isPrivate: {
        type: Boolean,
        default: false, // Default to false so users appear in search by default
    },
    friends: [{ type: mongodb_1.ObjectId, ref: 'user' }],
    friendRequests: [
        {
            senderId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'user' },
            receiverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'user' },
        },
    ],
    notifications: {
        promotional: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
        },
        transactional: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
        },
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
}, { timestamps: true });
userSchema.pre('save', function (next) {
    if (!this.notifications) {
        this.notifications = {
            promotional: { email: true, sms: true },
            transactional: { email: true, sms: true },
        };
    }
    next();
});
// Add the toJSON method to the schema
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};
const user = (0, mongoose_1.model)(tables_1.Tables.user, userSchema);
exports.default = user;
//# sourceMappingURL=user.schema.js.map