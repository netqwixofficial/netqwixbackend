"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoute = void 0;
const express_1 = require("express");
const validate_1 = require("../../validate");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const notificationsController_1 = require("./notificationsController");
const route = (0, express_1.Router)();
const notificationsController = new notificationsController_1.NotificationsController();
const V = new validate_1.validator();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
route.use([
    (req, res, next) => {
        req.byPassRoute = [];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
route.get('/', notificationsController.getNotifications);
route.get("/get-public-key", notificationsController.getPublicKey);
route.post("/subscription", notificationsController.getSubscription);
route.patch('/update', notificationsController.updateNotificationsStatus);
exports.notificationRoute = route;
//# sourceMappingURL=notificationsRoutes.js.map