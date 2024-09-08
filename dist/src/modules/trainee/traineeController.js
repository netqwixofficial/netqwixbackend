"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traineeController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const traineeService_1 = require("./traineeService");
const _ = require("lodash");
const trainerService_1 = require("../trainer/trainerService");
class traineeController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.traineeService = new traineeService_1.TraineeService();
        this.trainerService = new trainerService_1.TrainerService();
        this.getSlotsOfAllTrainers = async (req, res) => {
            try {
                const result = await this.traineeService.getSlotsOfAllTrainers(req.query);
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
        this.bookSession = async (req, res) => {
            try {
                const { body } = req;
                const result = await this.traineeService.bookSession(body, req["authUser"]["_id"]);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                if (req?.body?.slot_id) {
                    await this.trainerService.updateStot({ _id: req?.body?.slot_id, status: true });
                }
                else {
                    var date = new Date(body?.booked_date).toISOString().split("T")[0];
                    var dateArr = date?.split("-");
                    var start_time = body?.session_start_time;
                    var end_time = body?.session_end_time;
                    let start_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(start_time.split(":")[0]), Number(start_time.split(":")[1]), 0, 0).toISOString();
                    let end_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(end_time.split(":")[0]), Number(end_time.split(":")[1]), 0, 0).toISOString();
                    await this.trainerService.updateManyStot({
                        $and: [
                            {
                                $or: [
                                    {
                                        start_time: {
                                            $gt: start_time_date,
                                            $lt: end_time_date,
                                        },
                                    },
                                    {
                                        end_time: {
                                            $gt: start_time_date,
                                            $lt: end_time_date,
                                        },
                                    },
                                ],
                            },
                            {
                                trainer_id: body?.trainer_id
                            }
                        ]
                    }, { $set: { status: true } });
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
        this.bookInstantMeeting = async (req, res) => {
            try {
                const result = await this.traineeService.bookInstantMeeting(req["body"], req["authUser"]["_id"]);
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
                const result = await this.traineeService.updateProfile(payload, req.authUser);
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
        this.checkSlotExist = async (req, res) => {
            try {
                const result = await this.traineeService.checkSlotExist(req.body);
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
    }
}
exports.traineeController = traineeController;
//# sourceMappingURL=traineeController.js.map