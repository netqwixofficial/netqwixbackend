"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const responseBuilder_1 = require("../../helpers/responseBuilder");
const l10n = require("jm-ez-l10n");
const webpush = require("web-push");
const notifications_schema_1 = require("../../model/notifications.schema");
const user_schema_1 = require("../../model/user.schema");
//NOTE -  Set VAPID details
webpush.setVapidDetails('mailto:example@yourdomain.org', process.env.WEB_PUSH_PUBLIC_KEY, process.env.WEB_PUSH_PRIVATE_KEY);
class NotificationsService {
    async getPublicKey() {
        try {
            return responseBuilder_1.ResponseBuilder.data({ publicKey: process.env.WEB_PUSH_PUBLIC_KEY }, l10n.t("Web Push Public key"));
        }
        catch (error) {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getSubscription(req) {
        try {
            const userId = req?.authUser?._id;
            const { subscription } = req?.body;
            await user_schema_1.default.findByIdAndUpdate(userId, { $set: { subscriptionId: JSON.stringify(subscription) } });
            return responseBuilder_1.ResponseBuilder.successMessage("Subscription Id Updated successfully");
        }
        catch (error) {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getNotifications(req) {
        try {
            const userId = req?.authUser?._id;
            const { page, limit } = req?.query;
            const notifications = await notifications_schema_1.default.find({
                receiverId: userId
            })
                .populate('senderId')
                .sort({ createdAt: -1 })
                .skip(parseInt(limit) * (parseInt(page) - 1))
                .limit(parseInt(limit));
            const data = notifications?.map((notification) => {
                return {
                    _id: notification?._id,
                    title: notification?.title,
                    description: notification?.description,
                    createdAt: notification?.createdAt,
                    isRead: notification?.isRead,
                    sender: {
                        _id: notification?.senderId?._id,
                        name: notification?.senderId?.fullname,
                        profile_picture: notification?.senderId?.profile_picture || null
                    }
                };
            });
            return responseBuilder_1.ResponseBuilder.data(data, l10n.t("Get All Notifications"));
        }
        catch (error) {
            console.error("Error getting notifications:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateNotificationsStatus(req) {
        try {
            const userId = req?.authUser?._id;
            const { page } = req?.body;
            const notifications = await notifications_schema_1.default.find({
                receiverId: userId,
                isRead: false
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .skip((page - 1) * 10);
            const notificationIds = notifications?.map(notif => notif._id) || [];
            await notifications_schema_1.default.updateMany({ _id: { $in: notificationIds } }, { $set: { isRead: true } });
            return responseBuilder_1.ResponseBuilder.successMessage("Notification Status Updated successfully");
        }
        catch (error) {
            console.error("Error updating notification status:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
}
exports.NotificationsService = NotificationsService;
//# sourceMappingURL=notificationsService.js.map