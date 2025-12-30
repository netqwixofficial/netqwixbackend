"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traineeController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const traineeService_1 = require("./traineeService");
const _ = require("lodash");
const trainerService_1 = require("../trainer/trainerService");
const schedule = require("node-schedule");
const sendEmail_1 = require("../../Utils/sendEmail");
const user_schema_1 = require("../../model/user.schema");
const cron = require("node-cron");
const sms_service_1 = require("../../services/sms-service");
const Utils_1 = require("../../Utils/Utils");
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
                    await this.trainerService.updateStot({
                        _id: req?.body?.slot_id,
                        status: true,
                    });
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
                                trainer_id: body?.trainer_id,
                            },
                        ],
                    }, { $set: { status: true } });
                }
                const trainee = await user_schema_1.default.findById(result.result.trainee_id);
                const trainer = await user_schema_1.default.findById(result.result.trainer_id);
                if (!trainee || !trainer) {
                    return console.error("User not found.");
                }
                console.log("result.result.start_time", result.result.start_time);
                const startTime = (0, Utils_1.CovertTimeAccordingToTimeZone)(result.result.start_time, { to: "utc", from: result.result.time_zone });
                const runTime = startTime.minus({ minutes: 5 });
                console.log("startTime", startTime);
                console.log("runTime", runTime, runTime.toJSDate());
                if (!trainee.isPrivate && !trainer.isPrivate) {
                    if (!trainee.friends.includes(trainer._id)) {
                        trainee.friends.push(trainer._id);
                    }
                    if (!trainer.friends.includes(trainee._id)) {
                        trainer.friends.push(trainee._id);
                    }
                    await trainee.save();
                    await trainer.save();
                }
                console.log("datahaiji", result.result);
                console.log("`${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`", `${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`);
                const cronTime = `${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`;
                const meetingLink = process.env.FRONTEND_URL_SMS + "/meeting?id=";
                if (trainer.extraInfo.availabilityInfo.timeZone === result.result.time_zone) {
                    cron.schedule(cronTime, async () => {
                        try {
                            if (!trainee || !trainer) {
                                return console.error("User not found.");
                            }
                            // Send emails to both the trainee and trainer
                            sendEmail_1.SendEmail.sendRawEmail(null, null, [trainee.email], `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                <i  style='color:#ff0000'>${trainee.fullname},</i>
                <br/><br/>
                This is your ${constance_1.SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${constance_1.SessionReminderMinutes.FIVE} minutes.
                ${result.result.booked_date}
                <br/><br/>
                Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                Thank You For Booking the Slot in NetQwix.
                <br/><br/>
                From,  <br/>
                NetQwix Team. <br/>
                <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
              </div>`);
                            const covertedBookedTime = (0, Utils_1.CovertTimeAccordingToTimeZone)(result.result.booked_date, {
                                to: trainer.extraInfo.availabilityInfo.timeZone,
                                from: result.result.time_zone,
                            });
                            sendEmail_1.SendEmail.sendRawEmail(null, null, [trainer.email], `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                <i  style='color:#ff0000'>${trainer.fullname},</i>
                <br/><br/>
                This is your ${constance_1.SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${constance_1.SessionReminderMinutes.FIVE} minutes.
                ${result.result.booked_date}
                <br/><br/>
                Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                Thank You For Booking the Slot in NetQwix.
                <br/><br/>
                From,  <br/>
                NetQwix Team. <br/>
                <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
              </div>`);
                            const smsService = new sms_service_1.default();
                            await smsService.sendSMS(trainer.mobile_no, `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes` +
                                " With " +
                                trainee.fullname + `. Join with this link ${meetingLink + result.result._id}`);
                            await smsService.sendSMS(trainee.mobile_no, `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes` +
                                " With " +
                                trainer.fullname + `. Join with this link ${meetingLink + result.result._id}`);
                        }
                        catch (err) {
                            console.error("Error running cron job:", err);
                        }
                    });
                }
                else {
                    cron.schedule(cronTime, async () => {
                        console.log("Running Cron", cronTime);
                        try {
                            // Send emails to both the trainee and trainer
                            sendEmail_1.SendEmail.sendRawEmail(null, null, [trainee.email], `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                  <i  style='color:#ff0000'>${trainee.fullname},</i>
                  <br/><br/>
                  This is your ${constance_1.SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${constance_1.SessionReminderMinutes.FIVE} minutes.
                  ${result.result.booked_date}
                  <br/><br/>
                  Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                  Thank You For Booking the Slot in NetQwix.
                  <br/><br/>
                  From,  <br/>
                  NetQwix Team. <br/>
                  <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
                </div>`);
                            const covertedBookedTime = (0, Utils_1.CovertTimeAccordingToTimeZone)(result.result.booked_date, {
                                to: trainer.extraInfo.availabilityInfo.timeZone,
                                from: result.result.time_zone,
                            });
                            sendEmail_1.SendEmail.sendRawEmail(null, null, [trainer.email], `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes at ${covertedBookedTime}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                    <i  style='color:#ff0000'>${trainer.fullname},</i>
                    <br/><br/>
                    This is your ${constance_1.SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${constance_1.SessionReminderMinutes.FIVE} minutes.
                    ${covertedBookedTime}
                    <br/><br/>
                    Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                    Thank You For Booking the Slot in NetQwix.
                    <br/><br/>
                    From,  <br/>
                    NetQwix Team. <br/>
                    <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
                  </div>`);
                            const smsService = new sms_service_1.default();
                            await smsService.sendSMS(trainer.mobile_no, `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes` +
                                " With " +
                                trainee.fullname + `. Join with this link ${meetingLink + result.result._id}`);
                            await smsService.sendSMS(trainee.mobile_no, `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIVE} minutes` +
                                " With " +
                                trainer.fullname + `. Join with this link ${meetingLink + result.result._id}`);
                        }
                        catch (err) {
                            console.error("Error running cron job:", err);
                        }
                    });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                console.log("errorhaiji", err);
                this.logger.error(err);
                return res
                    .status(err.code || 500)
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
                console.log("req.body", req.body);
                console.log("UPDATE_FIELDS", constance_1.UPDATE_FIELDS);
                const payload = _.pick(req.body, constance_1.UPDATE_FIELDS.user);
                console.log("payload", payload);
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
                console.log("body", req.body);
                const result = await this.traineeService.checkSlotExist(req.body);
                const requestedDate = req.body.booked_date; // Assuming booked_date is a string in "YYYY-MM-DD" format
                const today = new Date().toISOString().split("T")[0]; // Format today's date as "YYYY-MM-DD"
                // Filter out past slots if the request is for today's date
                // Filter out past slots if the request is for today's date
                if (requestedDate === today) {
                    const currentTime = new Date();
                    result.result.availableSlots = result.result.availableSlots.filter((slot) => {
                        // Create a Date object for the slot's start time on today's date
                        const slotStartTime = new Date(`${requestedDate}T${slot.start}:00`); // Assuming time format "HH:MM"
                        // Only keep slots where the start time is later than the current time
                        return slotStartTime > currentTime;
                    });
                }
                console.log("result", JSON.stringify(result.result));
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result?.code || 404).send({ message: result.error });
                }
                return res
                    .status(result?.code || 200)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                console.log("err", err);
                return res
                    .status(err.code || 500)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err });
            }
        };
        this.recentTrainers = async (req, res) => {
            try {
                console.log("hello", req.authUser._id);
                const result = await this.trainerService.recentTrainers(req?.authUser._id);
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res.status(result.code).send({ message: result.error });
                }
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(err.code || 500).send({
                    status: constance_1.CONSTANCE.FAIL,
                    error: err.message || "Internal Server Error",
                });
            }
        };
    }
}
exports.traineeController = traineeController;
//# sourceMappingURL=traineeController.js.map