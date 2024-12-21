"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const responseBuilder_1 = require("../../helpers/responseBuilder");
const logger_1 = require("../../../logger");
const l10n = require("jm-ez-l10n");
const user_schema_1 = require("../../model/user.schema");
const write_us_schema_1 = require("../../model/write_us.schema");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const constance_1 = require("../../config/constance");
const mongoose_1 = require("mongoose");
const authEnum_1 = require("../auth/authEnum");
const sendEmail_1 = require("../../Utils/sendEmail");
const Utils_1 = require("../../Utils/Utils");
const stripeHelperController_1 = require("../stripe/stripeHelperController");
const raise_concern_schema_1 = require("../../model/raise_concern.schema");
const constant_1 = require("../../Utils/constant");
const online_user_schema_1 = require("../../model/online_user.schema");
const sms_service_1 = require("../../services/sms-service");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
class UserService {
    constructor() {
        this.log = logger_1.log.getLogger();
    }
    async createNewUser(createUser) {
        this.log.info(createUser);
        const userObj = new user_schema_1.default(createUser);
        await userObj.save();
        return responseBuilder_1.ResponseBuilder.data(createUser, l10n.t("USER_PROFILE_SUCCESS"));
    }
    async updateBookedSession(payload, bookedSessionId, account_type) {
        try {
            const bookedSessionDetail = await booked_sessions_schema_1.default.findById(bookedSessionId);
            if (bookedSessionDetail && bookedSessionDetail._id) {
                if (bookedSessionDetail["status"] === constance_1.BOOKED_SESSIONS_STATUS.cancel) {
                    return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("SESSION_STATUS_CAN_NOT_REVERT"));
                }
                const result = await booked_sessions_schema_1.default.findByIdAndUpdate({ _id: bookedSessionId }, { status: payload.booked_status }, { new: true });
                const bookedDate = Utils_1.Utils.formattedDateMonthDateYear(result.booked_date);
                const sessionDuration = Utils_1.Utils.timeDurations(result.session_start_time, result.session_end_time);
                const smsService = new sms_service_1.default();
                if (payload.booked_status === constance_1.BOOKED_SESSIONS_STATUS.confirm) {
                    const traineeInfo = await user_schema_1.default.findById(bookedSessionDetail["trainee_id"]);
                    const trainerInfo = await user_schema_1.default.findById(bookedSessionDetail["trainer_id"]);
                    const traineeName = traineeInfo.fullname;
                    const trainerName = trainerInfo.fullname;
                    sendEmail_1.SendEmail.sendRawEmail(null, null, [traineeInfo.email], `NetQwix Training Session has been ${payload.booked_status}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
          Hello <i  style='color:#ff0000'>${traineeName},</i>
          <br/><br/>
           Your NetQwix Training Session has been ${payload.booked_status} by your trainer <b><i style='color:#ff0000'>${trainerName}</i></b>
            for <b><i style='color:#ff0000'> ${bookedDate}.
           The session will last up to ${sessionDuration}.</i></b>
           <br/>
          Thank You
          <br/>
          Team NetQwix.
          <br/>
          <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
           </div> `);
                    const meetingLink = process.env.FRONTEND_URL + "/meeting?id=";
                    console.log("meeting link", meetingLink + bookedSessionDetail._id);
                    await smsService.sendSMS(traineeInfo.mobile_no, " NetQwix Training Session has been confirmed you may start the lesson using this link:- " + meetingLink + bookedSessionDetail._id);
                    await smsService.sendSMS(trainerInfo.mobile_no, " NetQwix Training Session has been confirmed you may start the lesson using this link:- " + meetingLink + bookedSessionDetail._id);
                }
                if (account_type === authEnum_1.AccountType.TRAINER &&
                    payload.booked_status === constance_1.BOOKED_SESSIONS_STATUS.cancel) {
                    const payment_intent_id = bookedSessionDetail.payment_intent_id;
                    const traineeInfo = await user_schema_1.default.findById(bookedSessionDetail["trainee_id"]);
                    const trainerInfo = await user_schema_1.default.findById(bookedSessionDetail["trainer_id"]);
                    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
                    const latest_charge = intent.latest_charge;
                    await stripe.refunds.create({
                        charge: latest_charge,
                        reverse_transfer: true,
                        refund_application_fee: true,
                    });
                    await booked_sessions_schema_1.default.findByIdAndUpdate(bookedSessionId, {
                        refund_status: "refunded",
                    });
                    await smsService.sendSMS(traineeInfo.mobile_no, "session was cancelled. payment will be refunded back to source.");
                    await smsService.sendSMS(trainerInfo.mobile_no, "session cancelled." + bookedDate + " " + result.session_start_time + " " + result.session_end_time);
                }
                return responseBuilder_1.ResponseBuilder.data({ result }, l10n.t("SESSION_STATUS_UPDATED"));
            }
            else {
                return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("INVALID_ID"));
            }
        }
        catch (err) {
            console.log(err);
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getMe(userInfo) {
        try {
            if (!userInfo) {
                return responseBuilder_1.ResponseBuilder.data({ userInfo }, "User not found");
            }
            if (userInfo.account_type === authEnum_1.AccountType.TRAINER &&
                !userInfo.is_kyc_completed) {
                const result = await stripeHelperController_1.stripeHelperController.getAccountByUserId(userInfo.stripe_account_id);
                if (result?.external_accounts?.data?.length > 0 &&
                    result?.charges_enabled == true &&
                    result?.details_submitted == true) {
                    const { _id } = userInfo;
                    const updatedUserInfo = await user_schema_1.default
                        .findByIdAndUpdate(_id, { is_kyc_completed: true })
                        .select("-subscriptionId");
                    if (!updatedUserInfo) {
                        return responseBuilder_1.ResponseBuilder.data({ userInfo }, "User not found");
                    }
                    return responseBuilder_1.ResponseBuilder.data({ updatedUserInfo }, "KYC completed");
                }
                return responseBuilder_1.ResponseBuilder.data({ userInfo }, "KYC not completed of this user");
            }
            return responseBuilder_1.ResponseBuilder.data({ userInfo }, "");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async shareClips(userInfo) {
        try {
            if (!userInfo) {
                return responseBuilder_1.ResponseBuilder.data({ userInfo }, "User not found");
            }
            else {
                var html = "";
                var clips = userInfo?.clips;
                for (let index = 0; index < clips.length; index++) {
                    const element = clips[index];
                    html =
                        html +
                            `
           <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; background-color: #fff; border-radius: 5px;">
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Title : ${element?.title}</div>
              <p><a href="https://pub-fffe76fa8765416caa3d396262faa16a.r2.dev/${element?._id}" target="_blank">https://pub-fffe76fa8765416caa3d396262faa16a.r2.dev/${element?._id}</a></p>
            </div>`;
                }
                sendEmail_1.SendEmail.sendRawEmail(null, null, [userInfo?.user_email], `NetQwix Video Clips`, null, `<div>
            ${html}
          </div>`);
                return responseBuilder_1.ResponseBuilder.data({}, "");
            }
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async inviteFriend(userInfo) {
        try {
            if (!userInfo) {
                return responseBuilder_1.ResponseBuilder.data({ userInfo }, "User not found");
            }
            else {
                sendEmail_1.SendEmail.sendRawEmail(null, null, [userInfo?.user_email], `Exclusive Invitation to Join NetQwix Platform!`, null, `<div>
            <h1>Exclusive Invitation to Join NetQwix Platform!</h1>
            <p>Please <a href="https://dev.netqwix.com"> click here</a> to join NetQwix.</p>
          </div>`);
                return responseBuilder_1.ResponseBuilder.data({}, "");
            }
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getScheduledMeetings(req) {
        const { authUser, query } = req;
        const { status, datetime, timezone } = query;
        try {
            let matchCondition = {};
            if (authUser && authUser.account_type === authEnum_1.AccountType.TRAINER) {
                matchCondition = {
                    trainer_id: new mongoose_1.Types.ObjectId(authUser._id),
                };
            }
            else {
                matchCondition = {
                    trainee_id: new mongoose_1.Types.ObjectId(authUser._id),
                };
            }
            const result = await booked_sessions_schema_1.default
                .aggregate([
                {
                    $match: { ...matchCondition,
                        time_zone: { $exists: true, $ne: null },
                        start_time: { $exists: true, $ne: null },
                        end_time: { $exists: true, $ne: null },
                        session_end_time: { $exists: true, $ne: null },
                        session_start_time: { $exists: true, $ne: null },
                        booked_date: { $exists: true, $ne: null } },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer_id",
                        foreignField: "_id",
                        as: "trainer_info",
                        pipeline: [
                            {
                                $project: constant_1.Constant.pipelineUser,
                            },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainee_id",
                        foreignField: "_id",
                        as: "trainee_info",
                        pipeline: [
                            {
                                $project: constant_1.Constant.pipelineUser,
                            },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "clips",
                        localField: "trainee_clip",
                        foreignField: "_id",
                        as: "trainee_clips",
                    },
                },
                {
                    $unwind: {
                        path: "$trainer_info",
                    },
                },
                {
                    $unwind: {
                        path: "$trainee_info",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        booked_date: 1,
                        session_start_time: 1,
                        session_end_time: 1,
                        session_link: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        ratings: { $ifNull: ["$ratings", null] },
                        trainer_info: 1,
                        trainee_info: 1,
                        trainee_clips: 1,
                        time_zone: 1,
                        start_time: 1,
                        end_time: 1,
                        report: 1,
                        iceServers: 1
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
            ])
                .exec();
            return responseBuilder_1.ResponseBuilder.data({ data: result }, l10n.t("MEETING_FETCHED"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateRatings(userInfo, payload, bookingInfo) {
        try {
            if (!bookingInfo.ratings)
                bookingInfo.ratings = {};
            const updatePayload = userInfo.account_type === authEnum_1.AccountType.TRAINEE
                ? { ...bookingInfo.ratings, trainee: payload }
                : { ...bookingInfo.ratings, trainer: payload };
            if (updatePayload &&
                updatePayload.trainer &&
                updatePayload.trainee &&
                updatePayload.trainer.sessionRating &&
                updatePayload.trainee.sessionRating) {
                bookingInfo.status = constance_1.BOOKED_SESSIONS_STATUS.completed;
            }
            bookingInfo["ratings"] = updatePayload;
            await booked_sessions_schema_1.default.findOneAndUpdate({ _id: bookingInfo["_id"] }, { $set: { ...bookingInfo } }, { new: true });
            return responseBuilder_1.ResponseBuilder.data({ bookingInfo }, l10n.t("RATING_SUBMITTED"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async addTraineeClip(payload, bookedSessionId) {
        try {
            const bookedSessionDetail = await booked_sessions_schema_1.default.findById(bookedSessionId);
            if (bookedSessionDetail && bookedSessionDetail._id) {
                const result = await booked_sessions_schema_1.default.findByIdAndUpdate({ _id: bookedSessionId }, { trainee_clip: payload.trainee_clip }, { new: true });
                return responseBuilder_1.ResponseBuilder.data({ result }, l10n.t("SESSION_STATUS_UPDATED"));
            }
            else {
                return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("INVALID_ID"));
            }
        }
        catch (err) {
            console.log(err);
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllTrainee(userInfo) {
        try {
            const { _id } = userInfo;
            var trainee = await user_schema_1.default.find({ account_type: authEnum_1.AccountType.TRAINEE });
            if (!trainee) {
                return responseBuilder_1.ResponseBuilder.data(trainee, "Trainee not found");
            }
            return responseBuilder_1.ResponseBuilder.data(trainee, l10n.t("GET_ALL_TRAINEES"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllTrainers(userInfo) {
        try {
            const { _id } = userInfo;
            var trainer = await user_schema_1.default.find({ account_type: authEnum_1.AccountType.TRAINER });
            if (!trainer) {
                return responseBuilder_1.ResponseBuilder.data(trainer, "Trainer not found");
            }
            return responseBuilder_1.ResponseBuilder.data(trainer, l10n.t("GET_ALL_TRAINERS"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateTrainerCommossion(body) {
        try {
            const { trainer_id, commission } = body;
            if (!trainer_id) {
                return responseBuilder_1.ResponseBuilder.badRequest("Trainer id is required");
            }
            // if (!commission) {
            //   return ResponseBuilder.badRequest("commission id is required");
            // }
            var trainer = await user_schema_1.default.findByIdAndUpdate(trainer_id, { commission });
            if (!trainer) {
                return responseBuilder_1.ResponseBuilder.data(trainer, "Trainer not found");
            }
            return responseBuilder_1.ResponseBuilder.data(trainer, "Commission updated successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateIsRegisteredWithStript(userInfo, body) {
        try {
            const { _id } = userInfo;
            const { stripe_account_id } = body;
            if (!stripe_account_id) {
                return responseBuilder_1.ResponseBuilder.badRequest("Stripe Account id can't be empty");
            }
            const updatedUserInfo = await user_schema_1.default.findByIdAndUpdate(_id, {
                is_registered_with_stript: true,
                stripe_account_id,
            });
            if (!updatedUserInfo) {
                return responseBuilder_1.ResponseBuilder.data([], "User not found");
            }
            return responseBuilder_1.ResponseBuilder.data([], "User Register with stripe successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateIsKYCCompleted(userInfo) {
        try {
            const { _id } = userInfo;
            const updatedUserInfo = await user_schema_1.default.findByIdAndUpdate(_id, {
                is_kyc_completed: true,
            });
            if (!updatedUserInfo) {
                return responseBuilder_1.ResponseBuilder.data([], "User not found");
            }
            return responseBuilder_1.ResponseBuilder.data([], "User KYC completed successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async createVerificationSessionStripeKYC(userInfo) {
        try {
            const session = await stripe.identity.verificationSessions.create({
                type: "document",
                metadata: {
                    user_id: "{{USER_ID}}",
                },
                options: {
                    document: {
                        require_matching_selfie: true,
                    },
                },
            });
            if (!session) {
                return responseBuilder_1.ResponseBuilder.data([], "session not found");
            }
            return responseBuilder_1.ResponseBuilder.data({ clientSecret: session.client_secret }, "Session completed successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllBooking() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer_id",
                        foreignField: "_id",
                        as: "trainer_info",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainee_id",
                        foreignField: "_id",
                        as: "trainee_info",
                    },
                },
                {
                    $addFields: {
                        trainer_info: {
                            $arrayElemAt: ["$trainer_info", 0],
                        },
                        trainee_info: {
                            $arrayElemAt: ["$trainee_info", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        trainer_id: 1,
                        trainee_id: 1,
                        status: 1,
                        booked_date: 1,
                        session_start_time: 1,
                        session_end_time: 1,
                        start_time: 1,
                        end_time: 1,
                        time_zone: 1,
                        payment_intent_id: 1,
                        trainee_clip: 1,
                        report: 1,
                        session_link: 1,
                        updatedAt: 1,
                        ratings: 1,
                        refund_status: 1,
                        "trainer_info.fullName": "$trainer_info.fullname",
                        "trainer_info.commission": "$trainer_info.commission",
                        "trainer_info.email": "$trainer_info.email",
                        "trainer_info.category": "$trainer_info.category",
                        "trainer_info.profilePicture": "$trainer_info.profile_picture",
                        "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
                        "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
                        "trainee_info.fullName": "$trainee_info.fullname",
                        "trainee_info.email": "$trainee_info.email",
                        "trainee_info.profilePicture": "$trainee_info.profile_picture",
                    },
                },
                {
                    $sort: {
                        updatedAt: -1, // Sort by updatedAt field in descending order
                    },
                },
            ];
            const booking_list = await booked_sessions_schema_1.default.aggregate(pipeline);
            if (!booking_list) {
                return responseBuilder_1.ResponseBuilder.data([], "booking_list not found");
            }
            return responseBuilder_1.ResponseBuilder.data(booking_list, "Booking Fetched successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllBookingById(trainer_id, account_type, page, limit) {
        try {
            const matchObj = {};
            if (account_type === "Trainer") {
                matchObj.trainer_id = trainer_id;
            }
            else {
                matchObj.trainee_id = trainer_id;
            }
            const pipeline = [
                {
                    $match: matchObj,
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer_id",
                        foreignField: "_id",
                        as: "trainer_info",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainee_id",
                        foreignField: "_id",
                        as: "trainee_info",
                    },
                },
                {
                    $addFields: {
                        trainer_info: {
                            $arrayElemAt: ["$trainer_info", 0],
                        },
                        trainee_info: {
                            $arrayElemAt: ["$trainee_info", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        trainer_id: 1,
                        trainee_id: 1,
                        status: 1,
                        booked_date: 1,
                        session_start_time: 1,
                        session_end_time: 1,
                        start_time: 1,
                        end_time: 1,
                        time_zone: 1,
                        payment_intent_id: 1,
                        trainee_clip: 1,
                        report: 1,
                        session_link: 1,
                        updatedAt: 1,
                        ratings: 1,
                        refund_status: 1,
                        amount: 1,
                        application_fee_amount: 1,
                        "trainer_info.fullName": "$trainer_info.fullname",
                        "trainer_info.commission": "$trainer_info.commission",
                        "trainer_info.email": "$trainer_info.email",
                        "trainer_info.category": "$trainer_info.category",
                        "trainer_info.profilePicture": "$trainer_info.profile_picture",
                        "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
                        "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
                        "trainee_info.fullName": "$trainee_info.fullname",
                        "trainee_info.email": "$trainee_info.email",
                        "trainee_info.profilePicture": "$trainee_info.profile_picture",
                    },
                },
                {
                    $sort: {
                        updatedAt: -1, // Sort by updatedAt field in descending order
                    },
                },
                {
                    $skip: (Number(page) - 1) * Number(limit), // Skip records based on page and limit
                },
                {
                    $limit: Number(limit), // Limit the number of records per page
                },
            ];
            const booking_list = await booked_sessions_schema_1.default.aggregate(pipeline);
            if (!booking_list) {
                return responseBuilder_1.ResponseBuilder.data([], "booking_list not found");
            }
            return responseBuilder_1.ResponseBuilder.data(booking_list, "Booking Fetched successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async createStripeAccountVarificationUrl(body) {
        try {
            const { stripe_account_id } = body;
            const path = "dashboard";
            let linkUrl = process.env.CLIENT_URL + "/" + path;
            const generated_url = await stripe.accountLinks
                .create({
                type: "account_onboarding",
                account: stripe_account_id,
                refresh_url: `${linkUrl}?refresh=true`,
                return_url: `${linkUrl}?`,
                collect: "currently_due",
            })
                .then((link) => link.url);
            if (!generated_url) {
                return responseBuilder_1.ResponseBuilder.badRequest("Stripe KYC URL not generated please try again!");
            }
            return responseBuilder_1.ResponseBuilder.data({ url: generated_url }, "KYC link generated successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async checkIsKycCompleted(userInfo, stripe_account_id) {
        try {
            if (!stripe_account_id) {
                return responseBuilder_1.ResponseBuilder.data([], "Stripe Id not found");
            }
            const result = await stripeHelperController_1.stripeHelperController.getAccountByUserId(stripe_account_id);
            if (result?.external_accounts?.data?.length > 0 &&
                result?.charges_enabled == true &&
                result?.details_submitted == true) {
                const { _id } = userInfo;
                const updatedUserInfo = await user_schema_1.default.findByIdAndUpdate(_id, {
                    is_kyc_completed: true,
                });
                if (!updatedUserInfo) {
                    return responseBuilder_1.ResponseBuilder.data([], "User not found");
                }
                return responseBuilder_1.ResponseBuilder.data([], "User KYC completed successfully");
            }
            else {
                return responseBuilder_1.ResponseBuilder.data([], "User KYC not completed successfully");
            }
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateRefundStatus(body) {
        try {
            const { booking_id, refund_status } = body;
            if (!booking_id) {
                return responseBuilder_1.ResponseBuilder.badRequest("Booking id is required");
            }
            if (!refund_status) {
                return responseBuilder_1.ResponseBuilder.badRequest("refund_status id is required");
            }
            var booking = await booked_sessions_schema_1.default.findByIdAndUpdate(booking_id, {
                refund_status,
            });
            if (!booking) {
                return responseBuilder_1.ResponseBuilder.badRequest("Booking not found");
            }
            return responseBuilder_1.ResponseBuilder.data({
                booking,
            }, "refund_status updated successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async captureWriteUs(id, body) {
        try {
            const { reason, description } = body;
            if (!description) {
                return responseBuilder_1.ResponseBuilder.badRequest("Description id is required");
            }
            const writeUs = new write_us_schema_1.default({ ...body, user_id: id });
            await writeUs.save();
            return responseBuilder_1.ResponseBuilder.data(writeUs, "Complain has been captured");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async createRaiseConcern(id, body) {
        try {
            const { reason, description } = body;
            if (!reason) {
                return responseBuilder_1.ResponseBuilder.badRequest("Reason is required");
            }
            if (!description) {
                return responseBuilder_1.ResponseBuilder.badRequest("Description id is required");
            }
            const raiseConcern = new raise_concern_schema_1.default({ ...body, user_id: id });
            await raiseConcern.save();
            return responseBuilder_1.ResponseBuilder.data(raiseConcern, "Complain has been captured");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getCaptureWriteUs() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_info",
                    },
                },
                {
                    $addFields: {
                        user_info: {
                            $arrayElemAt: ["$user_info", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        user_id: 1,
                        ticket_status: 1,
                        name: 1,
                        email: 1,
                        phone_number: 1,
                        subject: 1,
                        description: 1,
                        updatedAt: 1,
                        "user_info.fullName": "$user_info.fullname",
                        "user_info.commission": "$user_info.commission",
                        "user_info.email": "$user_info.email",
                        "user_info.category": "$user_info.category",
                        "user_info.profilePicture": "$user_info.profile_picture",
                        "user_info.stripe_account_id": "$user_info.stripe_account_id",
                        "user_info.is_kyc_completed": "$user_info.is_kyc_completed",
                        "user_info.account_type": "$user_info.account_type",
                    },
                },
                {
                    $sort: {
                        updatedAt: -1,
                    },
                },
            ];
            const booking_list = await write_us_schema_1.default.aggregate(pipeline);
            if (!booking_list) {
                return responseBuilder_1.ResponseBuilder.data([], "booking_list not found");
            }
            return responseBuilder_1.ResponseBuilder.data(booking_list, "Booking Fetched successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getRaiseConcern() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "users",
                        localField: "user_id",
                        foreignField: "_id",
                        as: "user_info",
                    },
                },
                {
                    $lookup: {
                        from: "booked_sessions",
                        localField: "booking_id",
                        foreignField: "_id",
                        as: "booking_details",
                    },
                },
                {
                    $addFields: {
                        user_info: {
                            $arrayElemAt: ["$user_info", 0],
                        },
                        booking_details: {
                            $arrayElemAt: ["$booking_details", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        user_id: 1,
                        booking_id: 1,
                        ticket_status: 1,
                        name: 1,
                        email: 1,
                        phone_number: 1,
                        reason: 1,
                        subject: 1,
                        description: 1,
                        updatedAt: 1,
                        is_releted_to_refund: 1,
                        "user_info.fullName": "$user_info.fullname",
                        "user_info.commission": "$user_info.commission",
                        "user_info.email": "$user_info.email",
                        "user_info.category": "$user_info.category",
                        "user_info.profilePicture": "$user_info.profile_picture",
                        "user_info.stripe_account_id": "$user_info.stripe_account_id",
                        "user_info.is_kyc_completed": "$user_info.is_kyc_completed",
                        "user_info.account_type": "$user_info.account_type",
                        booking_details: "$booking_details",
                    },
                },
                {
                    $sort: {
                        updatedAt: -1, // Sort by updatedAt field in descending order
                    },
                },
            ];
            const booking_list = await raise_concern_schema_1.default.aggregate(pipeline);
            if (!booking_list) {
                return responseBuilder_1.ResponseBuilder.data([], "booking_list not found");
            }
            return responseBuilder_1.ResponseBuilder.data(booking_list, "Booking Fetched successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateWriteUsTicketStatus(body) {
        try {
            const { id, ticket_status } = body;
            if (!id) {
                return responseBuilder_1.ResponseBuilder.badRequest("ID is required");
            }
            if (!ticket_status) {
                return responseBuilder_1.ResponseBuilder.badRequest("ticket_status id is required");
            }
            var contactUsResponse = await write_us_schema_1.default.findByIdAndUpdate(id, {
                ticket_status,
            });
            if (!contactUsResponse) {
                return responseBuilder_1.ResponseBuilder.badRequest("Booking not found");
            }
            return responseBuilder_1.ResponseBuilder.data({
                contactUsResponse,
            }, "Ticket status updated successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async updateRaiseConcernTicketStatus(body) {
        try {
            const { id, ticket_status } = body;
            if (!id) {
                return responseBuilder_1.ResponseBuilder.badRequest("ID is required");
            }
            if (!ticket_status) {
                return responseBuilder_1.ResponseBuilder.badRequest("ticket_status id is required");
            }
            var raiseConcernResponse = await raise_concern_schema_1.default.findByIdAndUpdate(id, {
                ticket_status,
            });
            if (!raiseConcernResponse) {
                return responseBuilder_1.ResponseBuilder.badRequest("Booking not found");
            }
            return responseBuilder_1.ResponseBuilder.data({
                raiseConcernResponse,
            }, "Ticket status updated successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllLatestOnlineUser() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer_id",
                        foreignField: "_id",
                        as: "trainer_info",
                    },
                },
                {
                    $addFields: {
                        trainer_info: {
                            $arrayElemAt: ["$trainer_info", 0],
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        last_activity_time: 1,
                        updatedAt: 1,
                        "trainer_info._id": "$trainer_info._id",
                        "trainer_info.fullName": "$trainer_info.fullname",
                        "trainer_info.commission": "$trainer_info.commission",
                        "trainer_info.email": "$trainer_info.email",
                        "trainer_info.category": "$trainer_info.category",
                        "trainer_info.profile_picture": "$trainer_info.profile_picture",
                        "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
                        "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
                        "trainer_info.extraInfo": "$trainer_info.extraInfo",
                    },
                },
                {
                    $sort: {
                        updatedAt: -1, // Sort by updatedAt field in descending order
                    },
                },
            ];
            const trainer = await online_user_schema_1.default.aggregate(pipeline);
            if (!trainer) {
                return responseBuilder_1.ResponseBuilder.data(trainer, "online Trainer not found");
            }
            return responseBuilder_1.ResponseBuilder.data(trainer, l10n.t("GET_ALL_TRAINERS"));
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map