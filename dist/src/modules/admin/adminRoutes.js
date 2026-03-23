"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoute = void 0;
const express_1 = require("express");
const adminController_1 = require("./adminController");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const route = (0, express_1.Router)();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
const adminController = new adminController_1.AdminController();
route.use([
    (req, res, next) => {
        req.byPassRoute = [];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
route.post("/update-global-commission", adminController.updateGlobalCommission);
route.get("/get-global-commission", adminController.getGlobalCommission);
route.get("/call-diagnostics", adminController.getCallDiagnostics);
route.get("/call-quality-summary/:sessionId", adminController.getCallQualitySummary);
exports.adminRoute = route;
//# sourceMappingURL=adminRoutes.js.map