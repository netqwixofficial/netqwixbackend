"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerRoute = void 0;
const express_1 = require("express");
const trainerController_1 = require("./trainerController");
const validate_1 = require("../../validate");
const updateSlotsValidator_1 = require("./trainerValidator/updateSlotsValidator");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const trainerMiddleware_1 = require("./trainerMiddleware");
const route = (0, express_1.Router)();
const trainerC = new trainerController_1.trainerController();
const V = new validate_1.validator();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
const trainerMiddleware = new trainerMiddleware_1.TrainerMiddleware();
route.get("/top-trainers", trainerC.getTrainers);
route.use([
    (req, res, next) => {
        req.byPassRoute = [];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
route.post("/update-slots", trainerMiddleware.isTrainer, V.validate(updateSlotsValidator_1.updateSlotsModel), trainerC.updateSchedulingSlots);
route.post("/add-slot", trainerMiddleware.isTrainer, trainerC.addStot);
route.post("/update-slot", trainerMiddleware.isTrainer, trainerC.updateStot);
route.post("/delete-slot", trainerMiddleware.isTrainer, trainerC.deleteStot);
route.post("/get-availability", trainerC.getAvailability);
route.get("/get-slots", trainerC.getSchedulingSlots);
route.get("/get-trainers", trainerC.getTrainers);
route.get("/get-recent-trainees", trainerC.recentTrainees);
route.post("/get-trainee-clips", trainerC.traineeClips);
// update profile
route.put("/profile", trainerC.updateProfile);
route.post("/create-money-request", trainerC.createMoneyRequest);
route.get("/get-money-request", trainerC.getAllMoneyRequest);
exports.trainerRoute = route;
//# sourceMappingURL=trainerRoutes.js.map