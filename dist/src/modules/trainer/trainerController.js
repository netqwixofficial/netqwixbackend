"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerController = void 0;
const mongoose_1 = require("mongoose");
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const trainerService_1 = require("./trainerService");
const _ = require("lodash");
class trainerController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.trainerService = new trainerService_1.TrainerService();
        this.updateSchedulingSlots = async (req, res) => {
            const { _id } = req.authUser;
            try {
                const result = await this.trainerService.updateSchedulingSlots(req.body, _id);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.addStot = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer_id = _id;
            try {
                const result = await this.trainerService.addStot(req.body);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateStot = async (req, res) => {
            try {
                const result = await this.trainerService.updateStot(req.body);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.deleteStot = async (req, res) => {
            try {
                const result = await this.trainerService.deleteStot(req.body);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAvailability = async (req, res) => {
            if (!req.body.trainer_id) {
                if (req?.authUser?._id) {
                    req.body.trainer_id = req?.authUser?._id;
                }
                else
                    return res
                        .status(200)
                        .send({ status: constance_1.CONSTANCE.FAIL, error: "Trainer id is required" });
            }
            else
                req.body.trainer_id = new mongoose_1.default.Types.ObjectId(req.body.trainer_id);
            try {
                const result = await this.trainerService.getAvailability(req.body);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getSchedulingSlots = async (req, res) => {
            const { _id } = req.authUser;
            try {
                const result = await this.trainerService.getSchedulingSlots(_id);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    return res
                        .status(result.code)
                        .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getTrainers = async (req, res) => {
            try {
                const result = await this.trainerService.getTrainers(req.query);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.recentTrainees = async (req, res) => {
            try {
                const result = await this.trainerService.recentTrainees(req?.authUser);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.traineeClips = async (req, res) => {
            try {
                const result = await this.trainerService.traineeClips(req?.body);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                const payload = _.pick(req.body, constance_1.UPDATE_FIELDS.user);
                console.log(`payload --- `, payload);
                const result = await this.trainerService.updateProfile(payload, req.authUser);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.createMoneyRequest = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.trainerService.createMoneyRequest(req.authUser, req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllMoneyRequest = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.trainerService.getAllMoneyRequest();
                    return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
    }
}
exports.trainerController = trainerController;
//# sourceMappingURL=trainerController.js.map