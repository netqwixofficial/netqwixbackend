"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traineeRoute = void 0;
const express_1 = require("express");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const traineeController_1 = require("./traineeController");
const validate_1 = require("../../validate");
const traineeValidator_1 = require("./traineeValidator");
const traineeMiddleware_1 = require("./traineeMiddleware");
const route = (0, express_1.Router)();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
const traineeC = new traineeController_1.traineeController();
const traineeMiddleware = new traineeMiddleware_1.TraineeMiddleware();
route.use([
    (req, res, next) => {
        req.byPassRoute = ["/get-trainers-with-slots", "/check-slot"];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
const V = new validate_1.validator();
route.get("/get-trainers-with-slots", traineeC.getSlotsOfAllTrainers);
route.post("/book-session", V.validate(traineeValidator_1.bookSessionModal), traineeC.bookSession);
route.post("/book-instant-meeting", traineeMiddleware.isTrainee, V.validate(traineeValidator_1.bookInstantMeetingModal), traineeC.bookInstantMeeting);
// update profile
route.put("/profile", traineeC.updateProfile);
// check slot available in given time and for trainer
route.post("/check-slot", V.validate(traineeValidator_1.checkSlotExistModal), traineeC.checkSlotExist);
exports.traineeRoute = route;
//# sourceMappingURL=traineeRoute.js.map