"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainerService = void 0;
const responseBuilder_1 = require("../../helpers/responseBuilder");
const l10n = require("jm-ez-l10n");
const logger_1 = require("../../../logger");
const schedule_inventory_schema_1 = require("../../model/schedule_inventory.schema");
const constance_1 = require("../../config/constance");
const user_schema_1 = require("../../model/user.schema");
const authEnum_1 = require("../auth/authEnum");
const availability_schema_1 = require("../../model/availability.schema");
const mongoose_1 = require("mongoose");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const clip_schema_1 = require("../../model/clip.schema");
const money_withdraw_schema_1 = require("./money_withdraw.schema");
const constant_1 = require("../../Utils/constant");
class TrainerService {
    constructor() {
        this.log = logger_1.log.getLogger();
    }
    async updateSchedulingSlots(schedulingSlots, user_id) {
        this.log.info(schedulingSlots);
        let trainerSlots = await schedule_inventory_schema_1.default.findOne({
            trainer_id: user_id,
        });
        if (trainerSlots) {
            await schedule_inventory_schema_1.default.updateOne({ trainer_id: user_id }, schedulingSlots);
            return responseBuilder_1.ResponseBuilder.data(schedulingSlots, l10n.t("SCHEDULE_SLOTS_UPDATED"));
        }
        else {
            const schedulingSlotsObj = new schedule_inventory_schema_1.default({
                ...schedulingSlots,
                trainer_id: user_id,
            });
            await schedulingSlotsObj.save();
            return responseBuilder_1.ResponseBuilder.data(schedulingSlots, l10n.t("SCHEDULE_SLOTS_UPDATED"));
        }
    }
    async addStot(data) {
        const slotObj = new availability_schema_1.default(data);
        var newSlotObj = await slotObj.save();
        return responseBuilder_1.ResponseBuilder.data(newSlotObj, "Slot Added Successfully.");
    }
    async updateStot(data) {
        const updatedSlot = await availability_schema_1.default.updateOne({ _id: data?._id }, data);
        return responseBuilder_1.ResponseBuilder.data(updatedSlot, "Slot Updated Successfully.");
    }
    async updateManyStot(filter, data) {
        const updatedSlot = await availability_schema_1.default.updateMany(filter, data);
        return responseBuilder_1.ResponseBuilder.data(updatedSlot, "Slot Updated Successfully.");
    }
    async deleteStot(data) {
        const updatedSlot = await availability_schema_1.default.deleteOne({ _id: data?._id });
        return responseBuilder_1.ResponseBuilder.data(updatedSlot, "Slot Deleted Successfully.");
    }
    async getAvailability(data) {
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        var start_time = data?.start_time ? data?.start_time : firstDayOfMonth;
        var end_time = data?.end_time ? data?.end_time : lastDayOfMonth;
        var availabilities = await availability_schema_1.default.aggregate([
            {
                '$match': {
                    '$and': [
                        {
                            'start_time': {
                                '$gte': new Date(start_time)
                            }
                        }, {
                            'end_time': {
                                '$lte': new Date(end_time)
                            }
                        },
                        { "trainer_id": data?.trainer_id }
                    ]
                }
            },
            // {
            //   '$group': {
            //     '_id': {
            //       '$dateToString': {
            //         'format': '%Y-%m-%d',
            //         'date': '$start_time',
            //       }
            //     },
            //     'availabilities': {
            //       '$push': '$$ROOT'
            //     }
            //   }
            // },
            {
                "$sort": {
                    "start_time": 1
                }
            }
        ]);
        return responseBuilder_1.ResponseBuilder.data(availabilities, "Availabilities find Successfully.");
    }
    async getSchedulingSlots(trainer_id) {
        this.log.info(trainer_id);
        const schedulingSlots = await schedule_inventory_schema_1.default.findOne({ trainer_id });
        if (schedulingSlots) {
            return responseBuilder_1.ResponseBuilder.data(schedulingSlots, l10n.t("SCHEDULE_SLOTS_FETCHED"));
        }
        else {
            return responseBuilder_1.ResponseBuilder.data(constance_1.CONSTANCE.SCHEDULING_SLOTS, l10n.t("SCHEDULE_SLOTS_FETCHED"));
        }
    }
    async getTrainers(query) {
        try {
            const result = await user_schema_1.default.aggregate([
                {
                    $match: {
                        $and: [{ account_type: authEnum_1.AccountType.TRAINER }],
                    },
                },
                {
                    $project: {
                        id: "$_id",
                        fullname: 1,
                        email: 1,
                        profile_picture: 1,
                        category: 1,
                        extraInfo: 1,
                        status: 1,
                    },
                },
            ]);
            return responseBuilder_1.ResponseBuilder.data(result, l10n.t("NO_TRAINERS_FOUND"));
        }
        catch (error) {
            console.error("Error getting trainers:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage("Internal server error");
        }
    }
    async recentTrainees(authUser) {
        try {
            const pipeline = [
                {
                    '$match': {
                        'trainer_id': new mongoose_1.default.Types.ObjectId(authUser?._id)
                    }
                }, {
                    '$group': {
                        '_id': '$trainee_id'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'trainee',
                        'pipeline': [
                            {
                                '$project': constant_1.Constant.pipelineUser,
                            }
                        ],
                    }
                }, {
                    '$unwind': {
                        'path': '$trainee'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$trainee'
                    }
                }
            ];
            const result = await booked_sessions_schema_1.default.aggregate(pipeline);
            return responseBuilder_1.ResponseBuilder.data(result, l10n.t("NO_TRAINERS_FOUND"));
        }
        catch (error) {
            console.error("Error getting recent trainees:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage("Internal server error");
        }
    }
    async traineeClips(data) {
        try {
            const result = await clip_schema_1.default.find({ 'user_id': data?.trainer_id }).sort({ createdAt: 1 });
            return responseBuilder_1.ResponseBuilder.data(result, l10n.t("NO_TRAINERS_FOUND"));
        }
        catch (error) {
            return responseBuilder_1.ResponseBuilder.errorMessage("Internal server error");
        }
    }
    async updateProfile(reqBody, authUser) {
        try {
            await user_schema_1.default.findOneAndUpdate({ _id: authUser["_id"].toString() }, { $set: { ...reqBody } }, { new: true });
            return responseBuilder_1.ResponseBuilder.data({}, l10n.t("PROFILE_UPDATED"));
        }
        catch (err) {
            console.error("Error updating profile:", err);
            throw err;
        }
    }
    async createMoneyRequest(userInfo, body) {
        try {
            const { _id } = userInfo;
            const getUser = await user_schema_1.default.findById(_id);
            const wallet_amount = getUser.wallet_amount;
            const { requested_amount } = body;
            if (!requested_amount) {
                return responseBuilder_1.ResponseBuilder.data([], "requested amount can't be empty");
            }
            if (Number(requested_amount) > Number(wallet_amount)) {
                return responseBuilder_1.ResponseBuilder.data([], "You can't request gretter then wallet amount");
            }
            const create_money_request = new money_withdraw_schema_1.default({ requested_amount, wallet_amount, trainer: _id });
            create_money_request.save();
            if (!create_money_request) {
                return responseBuilder_1.ResponseBuilder.data([], "Money Request canceled");
            }
            return responseBuilder_1.ResponseBuilder.data(create_money_request, "Money Request created successfully!");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getAllMoneyRequest() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer",
                        foreignField: "_id",
                        as: "trainee_info"
                    }
                },
                {
                    $addFields: {
                        "trainee_info": {
                            $arrayElemAt: ["$trainee_info", 0]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        wallet_amount: 1,
                        requested_amount: 1,
                        payment_status: 1,
                        trainer: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        "trainee_info.fullName": "$trainee_info.fullname",
                        "trainee_info.email": "$trainee_info.email",
                        "trainee_info.profilePicture": "$trainee_info.profile_picture",
                    }
                },
                {
                    $sort: {
                        updatedAt: -1 // Sort by updatedAt field in descending order
                    }
                }
            ];
            const money_request = await money_withdraw_schema_1.default.aggregate(pipeline);
            if (!money_request) {
                return responseBuilder_1.ResponseBuilder.data([], "Money Request not found");
            }
            return responseBuilder_1.ResponseBuilder.data(money_request, "Money Request Fetched successfully");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async recentTrainers(authUser) {
        try {
            const pipeline = [
                {
                    '$match': {
                        'trainee_id': new mongoose_1.default.Types.ObjectId(authUser)
                    }
                },
                {
                    '$group': {
                        '_id': '$trainer_id'
                    }
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'trainer',
                        'pipeline': [
                            {
                                '$project': constant_1.Constant.pipelineUser,
                            }
                        ],
                    }
                },
                {
                    '$unwind': {
                        'path': '$trainer'
                    }
                },
                {
                    '$replaceRoot': {
                        'newRoot': '$trainer'
                    }
                }
            ];
            const result = await booked_sessions_schema_1.default.aggregate(pipeline);
            return responseBuilder_1.ResponseBuilder.data(result, l10n.t("NO_TRAINERS_FOUND"));
        }
        catch (error) {
            console.error("Error getting recent trainers:", error);
            return responseBuilder_1.ResponseBuilder.errorMessage("Internal server error");
        }
    }
}
exports.TrainerService = TrainerService;
//# sourceMappingURL=trainerService.js.map