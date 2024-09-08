"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportRoute = void 0;
const express_1 = require("express");
const reportController_1 = require("./reportController");
const validate_1 = require("../../validate");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const reportMiddleware_1 = require("./reportMiddleware");
const route = (0, express_1.Router)();
const reportC = new reportController_1.reportController();
const V = new validate_1.validator();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
const reportMiddleware = new reportMiddleware_1.TrainerMiddleware();
route.use([
    (req, res, next) => {
        req.byPassRoute = [];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
route.post("", reportMiddleware.isTrainer, reportC.createReport);
route.post("/add-image", reportMiddleware.isTrainer, reportC.addImage);
route.post("/remove-image", reportMiddleware.isTrainer, reportC.removeImage);
route.post("/crop-image", reportMiddleware.isTrainer, reportC.cropImage);
route.post("/get", reportMiddleware.isTrainer, reportC.getReport);
route.post("/get-all", reportC.getAllReport);
route.delete('/delete-report/:id', reportC.deleteReport);
exports.reportRoute = route;
//# sourceMappingURL=reportRoutes.js.map