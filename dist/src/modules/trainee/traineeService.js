"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraineeService = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const mongoose_1 = require("../../helpers/mongoose");
const responseBuilder_1 = require("../../helpers/responseBuilder");
const schedule_inventory_schema_1 = require("../../model/schedule_inventory.schema");
const l10n = require("jm-ez-l10n");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const dateFormat_1 = require("../../Utils/dateFormat");
const sendEmail_1 = require("../../Utils/sendEmail");
const user_schema_1 = require("../../model/user.schema");
const Utils_1 = require("../../Utils/Utils");
const mongoose = require("mongoose");
const luxon_1 = require("luxon");
const sms_service_1 = require("../../services/sms-service");
class TraineeService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.filterTrainersByDayAndTime = async (day, time) => {
            try {
                console.log(`filterQuery ---- `, day, time);
                const result = await schedule_inventory_schema_1.default
                    .aggregate([
                    {
                        $unwind: "$available_slots",
                    },
                    {
                        $match: day
                            ? {
                                "available_slots.day": day,
                            }
                            : {},
                    },
                    {
                        $unwind: "$available_slots.slots",
                    },
                    {
                        $match: {
                            "available_slots.slots.start_time": { $ne: "" },
                            "available_slots.slots.end_time": { $ne: "" },
                            $expr: {
                                $and: [
                                    {
                                        $gte: ["$available_slots.slots.end_time", time.form],
                                    },
                                    {
                                        $lte: ["$available_slots.slots.start_time", time.to],
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            trainer_id: 1,
                            available_slots: 1,
                        },
                    },
                ])
                    .exec();
                console.log(`available_slots ---- `, result);
                return result;
            }
            catch (err) {
                console.log(`err ---- `, err);
                throw err;
            }
        };
    }
    async getSlotsOfAllTrainers(query) {
        try {
            const { search, day = null, time = JSON.stringify({ from: "00:00", to: "23:59" }), } = query;
            if (typeof search !== "string" ||
                search.trim() === "" ||
                !isNaN(Number(search))) {
                return responseBuilder_1.ResponseBuilder.badRequest("Search parameter must be a non-empty string", 400);
            }
            let searchQuery = (0, mongoose_1.getSearchRegexQuery)(search, constance_1.CONSTANCE.USERS_SEARCH_KEYS);
            // const filteredTrainer =
            //   (day && day.length) || (time && time.length)
            //     ? (
            //         await this.filterTrainersByDayAndTime(
            //           day,
            //           time ? JSON.parse(time) : null
            //         )
            //       ).map((trainer) => trainer.trainer_id)
            //     : [];
            // console.info("searchQuery---", JSON.stringify(searchQuery));
            // const result = await schedule_inventory.aggregate([
            //   {
            //     $match:
            //       Array.isArray(filteredTrainer) && filteredTrainer.length
            //         ? {
            //             trainer_id: { $in: filteredTrainer || [] },
            //           }
            //         : {},
            //   },
            //   {
            //     $lookup: {
            //       from: "users",
            //       localField: "trainer_id",
            //       foreignField: "_id",
            //       as: "trainer",
            //     },
            //   },
            //   {
            //     $match: searchQuery,
            //   },
            //   {
            //     $lookup: {
            //       from: "booked_sessions",
            //       localField: "trainer_id",
            //       foreignField: "trainer_id",
            //       let: {
            //         session_booked_trainer_id: "$trainer_id",
            //         session_booked_status: "$status",
            //         session_ratings: "$ratings",
            //       },
            //       pipeline: [
            //         {
            //           $lookup: {
            //             from: "users",
            //             localField: "trainee_id",
            //             foreignField: "_id",
            //             as: "trainee_info",
            //           },
            //         },
            //         {
            //           $match: {
            //             $or: [
            //               { status: BOOKED_SESSIONS_STATUS.confirm },
            //               { status: BOOKED_SESSIONS_STATUS.completed },
            //             ],
            //           },
            //         },
            //         {
            //           $project: {
            //             status: 1,
            //             trainee_fullname: {
            //               $arrayElemAt: ["$trainee_info.fullname", 0],
            //             },
            //             updatedAt: 1,
            //             ratings: {
            //               trainee: {
            //                 sessionRating: 1,
            //                 recommendRating: 1,
            //                 audioVideoRating: 1,
            //                 title: 1,
            //                 remarksInfo: 1,
            //                 traineeFullname: 1,
            //               },
            //             },
            //           },
            //         },
            //       ],
            //       as: "trainer_ratings",
            //     },
            //   },
            //   {
            //     $project: {
            //       _id: 1,
            //       trainer_ratings: 1,
            //       trainer_id: 1,
            //       available_slots: 1,
            //       extraInfo: { $arrayElemAt: ["$trainer.extraInfo", 0] },
            //       fullname: { $arrayElemAt: ["$trainer.fullname", 0] },
            //       email: { $arrayElemAt: ["$trainer.email", 0] },
            //       category: { $arrayElemAt: ["$trainer.category", 0] },
            //       profilePicture: { $arrayElemAt: ["$trainer.profile_picture", 0] },
            //     },
            //   },
            // ]);
            const pipeline = [
                {
                    $match: {
                        $and: [{ account_type: "Trainer" }],
                        $or: searchQuery.$or,
                    },
                },
                {
                    $lookup: {
                        from: "booked_sessions",
                        localField: "_id",
                        foreignField: "trainer_id",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "users",
                                    localField: "trainee_id",
                                    foreignField: "_id",
                                    as: "trainee_info",
                                },
                            },
                            {
                                $match: {
                                    $or: [
                                        { status: constance_1.BOOKED_SESSIONS_STATUS.confirm },
                                        { status: constance_1.BOOKED_SESSIONS_STATUS.completed },
                                    ],
                                },
                            },
                            {
                                $project: {
                                    status: 1,
                                    trainee_fullname: {
                                        $arrayElemAt: ["$trainee_info.fullname", 0],
                                    },
                                    updatedAt: 1,
                                    ratings: 1,
                                },
                            },
                        ],
                        as: "trainer_ratings",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        available_slots: constance_1.CONSTANCE.SCHEDULING_SLOTS.available_slots,
                        trainer_id: "$_id",
                        trainer_ratings: 1,
                        extraInfo: 1,
                        fullname: 1,
                        email: 1,
                        category: 1,
                        profile_picture: "$profile_picture",
                        stripe_account_id: 1,
                        is_kyc_completed: 1,
                        commission: 1,
                    },
                },
            ];
            const result = await user_schema_1.default.aggregate(pipeline);
            return responseBuilder_1.ResponseBuilder.data(result, l10n.t("GET_ALL_SLOTS"));
        }
        catch (err) {
            console.log(`err ---- `, err);
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async bookSession(payload, _id) {
        try {
            if (!payload ||
                !payload.trainer_id ||
                !payload.booked_date ||
                !payload.session_start_time ||
                !payload.session_end_time ||
                !payload.charging_price ||
                !payload.time_zone) {
                const validationError = {
                    type: "BAD_DATA",
                    name: "",
                    message: "",
                    description: "Invalid input data",
                    errorStack: "",
                    title: "Bad Request",
                    data: null,
                };
                return responseBuilder_1.ResponseBuilder.error(validationError, "Invalid input data");
            }
            if (!constance_1.timeRegex.test(typeof payload.session_start_time === "string" &&
                payload.session_start_time) ||
                !constance_1.timeRegex.test(typeof payload.session_end_time === "string" &&
                    payload.session_end_time)) {
                return responseBuilder_1.ResponseBuilder.badRequest("Invalid time format. Please use HH:mm format.");
            }
            const sessionObj = new booked_sessions_schema_1.default({
                ...payload,
                trainee_id: _id,
                time_zone: payload.time_zone,
            });
            const trainerId = sessionObj["trainer_id"];
            const trainerDetails = await user_schema_1.default.findById({ _id: trainerId });
            const traineeId = sessionObj["trainee_id"];
            const traineeDetails = await user_schema_1.default.findById({ _id: traineeId });
            const bookedDate = Utils_1.Utils.formattedDateMonthDateYear(sessionObj["booked_date"]);
            const startTime = Utils_1.Utils.convertToAmPm(sessionObj["session_start_time"]);
            console.log(startTime);
            const endTime = Utils_1.Utils.convertToAmPm(sessionObj["session_end_time"]);
            console.log(endTime);
            const bookedTime = `${startTime} To ${endTime}`;
            const subject = `NetQwix Training Session Booked for ${bookedDate} at ${bookedTime} EST`;
            const traineeMessageTemplate = `<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 18px; line-height: 30px;">
        Dear <i style='color:#ff0000'>${traineeDetails.fullname},</i>
        <br/><br/>
        Thank You for booking your NetQwix Training Session with <i style='color:#ff0000'>${trainerDetails.fullname}</i>.
        Your session has been booked for <i style='color:#ff0000'>${bookedDate}</i> at <i style='color:#ff0000'>${bookedTime} EST</i>.
        <br/><br/>
        Team NetQwix.
        <br/>
        <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
      </div>`;
            const trainerMessageTemplate = `<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 18px; line-height: 30px;">
        Dear <i style='color:#ff0000'>${trainerDetails.fullname},</i>
        <br/><br/>
        Thank You for booking your NetQwix Training Session with <i style='color:#ff0000'>${traineeDetails.fullname}</i>.
        Your session has been booked for <i style='color:#ff0000'>${bookedDate}</i> at <i style='color:#ff0000'>${bookedTime} EST</i>.
        <br/><br/>
        Team NetQwix.
        <br/>
        <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
      </div>`;
            const charging_price = `${constance_1.amountType.USD}${+payload.charging_price}.`;
            const paymentConfirmationSubject = "NetQwix payment confirmed";
            const paymentConfirmationMessage = `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
        	Hello <i  style='color:#ff0000'>${traineeDetails.fullname},</i>
          <br/><br/>
        	 Payment received successfully <b><i style='color:#ff0000'>${charging_price}</i></b>
          <br/><br/>
           Please wait for ${trainerDetails.fullname} to confirm the booking. We'll notify you as soon as its done.
           <br/><br/>
        	Thank You
          <br/>
        	Team NetQwix.
          <br/>
        	<img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
        	</div>`;
            sendEmail_1.SendEmail.sendRawEmail(null, null, traineeDetails.email, subject, null, traineeMessageTemplate);
            sendEmail_1.SendEmail.sendRawEmail(null, null, trainerDetails.email, subject, null, trainerMessageTemplate);
            const smsService = new sms_service_1.default();
            await smsService.sendSMS(trainerDetails.mobile_no, subject + " With " + traineeDetails.fullname);
            await smsService.sendSMS(traineeDetails.mobile_no, subject + " With " + trainerDetails.fullname);
            if (payload.status === constance_1.BOOKED_SESSIONS_STATUS["BOOKED"]) {
                sendEmail_1.SendEmail.sendRawEmail(null, null, [traineeDetails.email], paymentConfirmationSubject, null, paymentConfirmationMessage);
            }
            var bookingData = await sessionObj.save();
            await user_schema_1.default.updateOne({ _id: payload.trainer_id }, { $inc: { wallet_amount: +payload.charging_price || 0 } });
            return responseBuilder_1.ResponseBuilder.data(bookingData, l10n.t("SESSION_BOOKED"));
        }
        catch (err) {
            console.log(err);
            const failure = {
                description: err.message,
                errorStack: err.stack || "",
                title: "Internal Server Error",
                type: "CODE",
                data: null,
                name: "",
                message: "",
            };
            return responseBuilder_1.ResponseBuilder.error(failure, "ERR_INTERNAL_SERVER");
        }
    }
    async bookInstantMeeting(payload, _id) {
        const { trainer_id, booked_date } = payload;
        try {
            const session_start_time = dateFormat_1.DateFormat.addMinutes(booked_date, 10, constance_1.CONSTANCE.INSTANT_MEETING_TIME_FORMAT);
            const session_end_time = dateFormat_1.DateFormat.addMinutes(booked_date, 40, constance_1.CONSTANCE.INSTANT_MEETING_TIME_FORMAT);
            const userObj = new booked_sessions_schema_1.default({
                trainer_id,
                trainee_id: _id,
                status: constance_1.BOOKED_SESSIONS_STATUS.confirm,
                booked_date,
                session_start_time,
                session_end_time,
            });
            await userObj.save();
            const trainerDetails = await user_schema_1.default
                .findById(trainer_id)
                .select({ _id: 0, fullname: 1, email: 1 });
            sendEmail_1.SendEmail.sendRawEmail("meeting", {
                "{NAME}": `${trainerDetails.fullname}`,
                "{MEETING_URL}": "https://google.com",
            }, [trainerDetails.email], "Instant Meeting");
            return responseBuilder_1.ResponseBuilder.data({}, l10n.t("INSTANT_MEETING_BOOKED"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateProfile(reqBody, authUser) {
        try {
            console.log("reqBody", reqBody);
            console.log("authUser", authUser);
            await user_schema_1.default.findOneAndUpdate({ _id: authUser["_id"].toString() }, { $set: { ...reqBody } }, { new: true });
            return responseBuilder_1.ResponseBuilder.data({}, l10n.t("PROFILE_UPDATED"));
        }
        catch (err) {
            throw err;
        }
    }
    async checkSlotExist(reqBody) {
        try {
            const { slotTime, trainer_id, booked_date, traineeTimeZone } = reqBody;
            // Validate required fields
            if (!slotTime?.from || !slotTime?.to) {
                return responseBuilder_1.ResponseBuilder.badRequest("Missing slot time", 400);
            }
            if (!traineeTimeZone) {
                return responseBuilder_1.ResponseBuilder.badRequest("Missing trainee timezone", 400);
            }
            if (!booked_date) {
                return responseBuilder_1.ResponseBuilder.badRequest("Missing booked date", 400);
            }
            if (!trainer_id) {
                return responseBuilder_1.ResponseBuilder.badRequest("Missing trainer ID", 400);
            }
            // Fetch trainer info
            const trainerInfo = await user_schema_1.default.findById(trainer_id);
            if (!trainerInfo?.extraInfo?.availabilityInfo) {
                return responseBuilder_1.ResponseBuilder.badRequest("Trainer availability not set", 400);
            }
            const { availabilityInfo } = trainerInfo.extraInfo;
            console.log("traineeTimeZone", traineeTimeZone);
            console.log("trainerTimeZone", availabilityInfo.timeZone);
            // Determine day of the week
            const date = luxon_1.DateTime.fromISO(booked_date, { zone: 'utc' });
            const dayOfWeek = date.toFormat("ccc");
            console.log("date", date);
            console.log("booked_date", dayOfWeek);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            // const dayOfWeek = days[date.getDay()];
            console.log("availabilityInfo", availabilityInfo);
            // Get trainer's availability for the day
            const dayAvailability = availabilityInfo.availability?.[dayOfWeek] || [];
            if (dayAvailability.length === 0) {
                return responseBuilder_1.ResponseBuilder.data({
                    isAvailable: false,
                    availableSlots: [],
                    message: "Trainer not available on this day",
                    trainerTimezone: availabilityInfo.timeZone,
                    traineeTimezone: traineeTimeZone,
                });
            }
            const timeSlots = Utils_1.Utils.generateTimeSlots(dayAvailability, availabilityInfo, booked_date, traineeTimeZone);
            console.log("timeSlots", timeSlots);
            // Fetch existing bookings
            const existingBookings = await booked_sessions_schema_1.default
                .aggregate([
                {
                    $match: {
                        trainer_id: new mongoose.Types.ObjectId(trainer_id),
                        status: { $ne: constance_1.BOOKED_SESSIONS_STATUS.cancel },
                        $expr: {
                            $eq: [
                                {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
                                        date: "$booked_date",
                                    },
                                },
                                booked_date.split("T")[0],
                            ],
                        },
                    },
                },
                {
                    $project: {
                        start_time: 1,
                        end_time: 1,
                        time_zone: 1
                    },
                },
            ])
                .exec();
            console.log("existingBookings", existingBookings);
            // Convert existing bookings' times to trainee's time zone only if necessary
            const normalizedBookings = existingBookings.map(booking => {
                let startTraineeTime = booking.start_time;
                let endTraineeTime = booking.end_time;
                if (traineeTimeZone !== booking.time_zone) {
                    console.log("bookingStrt", booking.start_time, booking.time_zone);
                    startTraineeTime = new Date((0, Utils_1.CovertTimeAccordingToTimeZone)(booking.start_time, {
                        to: traineeTimeZone,
                        from: booking.time_zone,
                    }).ts);
                    endTraineeTime = new Date((0, Utils_1.CovertTimeAccordingToTimeZone)(booking.end_time, {
                        to: traineeTimeZone,
                        from: booking.time_zone,
                    }).ts);
                }
                return { start: startTraineeTime, end: endTraineeTime };
            });
            console.log("normalizedBookings", normalizedBookings);
            // Remove overlapping available slots
            const availableSlots = timeSlots.filter(slot => {
                return !normalizedBookings.some(booking => (0, Utils_1.isOverlap)(slot, booking));
            });
            console.log("dayAvailability", dayAvailability);
            return responseBuilder_1.ResponseBuilder.data({
                isAvailable: availableSlots.length > 0,
                availableSlots: availableSlots,
                trainerTimezone: availabilityInfo.timeZone,
                traineeTimezone: availableSlots,
                debug: {
                    dayOfWeek,
                    dayAvailability,
                    existingBookings,
                    requestedTimeRange: { from: slotTime.from, to: slotTime.to },
                    slotsBeforeFiltering: dayAvailability.length,
                },
            });
        }
        catch (error) {
            console.error("Error in checkSlotExist:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage("An error occurred");
        }
    }
}
exports.TraineeService = TraineeService;
//# sourceMappingURL=traineeService.js.map