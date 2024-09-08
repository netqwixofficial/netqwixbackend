"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const express = require("express");
const userRoutes_1 = require("./src/modules/user/userRoutes");
const authRoutes_1 = require("./src/modules/auth/authRoutes");
const masterRoutes_1 = require("./src/modules/master/masterRoutes");
const trainerRoutes_1 = require("./src/modules/trainer/trainerRoutes");
const reportRoutes_1 = require("./src/modules/report/reportRoutes");
const traineeRoute_1 = require("./src/modules/trainee/traineeRoute");
const transactionRoutes_1 = require("./src/modules/transaction/transactionRoutes");
const commonRoutes_1 = require("./src/modules/common/commonRoutes");
const adminRoutes_1 = require("./src/modules/admin/adminRoutes");
const notificationsRoutes_1 = require("./src/modules/notifications/notificationsRoutes");
class Routes {
    constructor() { }
    routePath() {
        const router = express.Router();
        router.use("/user", userRoutes_1.userRoute);
        router.use("/auth", authRoutes_1.authRoute);
        router.use("/master", masterRoutes_1.masterRoute);
        router.use("/trainer", trainerRoutes_1.trainerRoute);
        router.use("/trainee", traineeRoute_1.traineeRoute);
        router.use("/transaction", transactionRoutes_1.transactionRoute);
        router.use("/common", commonRoutes_1.commonRoute);
        router.use("/report", reportRoutes_1.reportRoute);
        router.use("/admin", adminRoutes_1.adminRoute);
        router.use("/notifications", notificationsRoutes_1.notificationRoute);
        router.get("/", (req, res) => {
            res.send("Welcome to NetQwix :) ");
        });
        return router;
    }
}
exports.Routes = Routes;
//# sourceMappingURL=routes.js.map