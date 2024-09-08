"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const logger_1 = require("./../../../logger");
const constance_1 = require("./../../config/constance");
const userService_1 = require("./userService");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
class userController {
    constructor() {
        this.userService = new userService_1.UserService();
        this.logger = logger_1.log.getLogger();
        this.createNewUser = async (req, res) => {
            try {
                const result = await this.userService.createNewUser(req.model);
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
        this.updateBookedSession = async (req, res) => {
            try {
                const { id } = req["params"];
                const result = await this.userService.updateBookedSession(req.body, id, req?.authUser?.account_type);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getScheduledMeetings = async (req, res) => {
            try {
                const result = await this.userService.getScheduledMeetings(req);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getMe = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getMe(req.authUser);
                    var newResult = JSON.parse(JSON.stringify(result.result));
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        if (req?.authUser?.account_type === "Trainer") {
                            var ratings = await booked_sessions_schema_1.default.find({ trainer_id: req?.authUser?._id });
                            newResult.userInfo.ratings = ratings;
                        }
                        res.status(result.code).json(newResult);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.shareClips = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.shareClips({ ...req.body, ...req.authUser });
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result.result);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.inviteFriend = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.inviteFriend({ ...req.body, ...req.authUser });
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result.result);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateRatings = async (req, res) => {
            try {
                const result = await this.userService.updateRatings(req.authUser, req["model"], req["booked_session_info"]);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.addTraineeClip = async (req, res) => {
            try {
                const { id } = req["params"];
                const result = await this.userService.addTraineeClip(req.body, id);
                if (result.status !== constance_1.CONSTANCE.FAIL)
                    res.status(result.code).json(result.result);
                else
                    res.status(result.code).json({ status: result.status, error: result.error, code: constance_1.CONSTANCE.RES_CODE.error.badRequest });
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllTrainee = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllTrainee(req.authUser);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllTrainers = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllTrainers(req.authUser);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateTrainerCommossion = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateTrainerCommossion(req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateIsRegisteredWithStript = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateIsRegisteredWithStript(req.authUser, req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateIsKYCCompleted = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateIsKYCCompleted(req.authUser);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        /**
         * Stripe User KYC
         */
        this.createVerificationSessionStripeKYC = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.createVerificationSessionStripeKYC(req.authUser);
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
        this.getAllBooking = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllBooking();
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
        this.getAllBookingById = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const trainer_id = req["authUser"]?._id;
                    const account_type = req["authUser"]?.account_type;
                    const page = req?.query?.page ?? 1;
                    const limit = req?.query?.limit ?? 2000;
                    const result = await this.userService.getAllBookingById(trainer_id, account_type, page, limit);
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
        this.createStripeAccountVarificationUrl = async (req, res) => {
            try {
                // if (req["authUser"]) {
                const result = await this.userService.createStripeAccountVarificationUrl(req.body);
                return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                // }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.checkIsKycCompleted = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const stripe_account_id = req["authUser"].stripe_account_id;
                    const result = await this.userService.checkIsKycCompleted(req["authUser"], stripe_account_id);
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
        this.updateRefundStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateRefundStatus(req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.captureWriteUs = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.captureWriteUs(id, req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.createRaiseConcern = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.createRaiseConcern(id, req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getCaptureWriteUs = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.getCaptureWriteUs();
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getRaiseConcern = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.getRaiseConcern();
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateWriteUsTicketStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateWriteUsTicketStatus(req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateRaiseConcernTicketStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateRaiseConcernTicketStatus(req.body);
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
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllLatestOnlineUser = async (req, res) => {
            try {
                const result = await this.userService.getAllLatestOnlineUser();
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
            catch (err) {
                return res
                    .status(500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
    }
}
exports.userController = userController;
//# sourceMappingURL=userController.js.map