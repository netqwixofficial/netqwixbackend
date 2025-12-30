"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const responseBuilder_1 = require("../../helpers/responseBuilder");
const l10n = require("jm-ez-l10n");
const logger_1 = require("../../../logger");
const report_schema_1 = require("../../model/report.schema");
const constance_1 = require("../../config/constance");
const commonService_1 = require("../common/commonService");
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const AWS = require("aws-sdk");
const mongoose_1 = require("mongoose");
const constant_1 = require("../../Utils/constant");
const s3 = new AWS.S3({
    endpoint: `https://${process.env.CLOUDFLARE_R2}.r2.cloudflarestorage.com`,
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: "v4",
});
class ReportService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.commonService = new commonService_1.commonService();
        this.generatePreSignedPutUrl = async (fileName, fileType) => {
            const params = {
                Bucket: bucketName,
                Key: fileName,
                Expires: 60,
                // ACL: "public-read",
                ContentType: fileType,
            };
            let url;
            try {
                url = await s3.getSignedUrlPromise("putObject", params);
            }
            catch (err) {
                console.log("err", err);
                // do something with the error here
                // and abort the operation.
                return;
            }
            return url;
        };
    }
    async createReport(data) {
        const report = await report_schema_1.default.updateOne({
            sessions: data?.sessions,
            trainee: data?.trainee,
            trainer: data?.trainer,
        }, {
            title: data?.title,
            description: data?.topic,
            reportData: data?.reportData,
        });
        if (report) {
            return responseBuilder_1.ResponseBuilder.data(report, l10n.t("REPORT_GENERATED"));
        }
        else {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async addImage(data) {
        var filename = "file-" + new Date().getTime().toString() + ".png";
        const isReportExist = await report_schema_1.default.findOne({
            sessions: data?.sessions,
            trainee: data?.trainee,
            trainer: data?.trainer,
        });
        if (isReportExist) {
            const result = await report_schema_1.default.updateOne({
                sessions: data?.sessions,
                trainee: data?.trainee,
                trainer: data?.trainer,
            }, {
                $push: {
                    reportData: {
                        title: "",
                        description: "",
                        imageUrl: filename,
                    },
                },
            });
        }
        else {
            var obj = {
                title: data?.title,
                description: data?.description,
                reportData: [
                    {
                        title: "",
                        description: "",
                        imageUrl: filename,
                    },
                ],
                sessions: data?.sessions,
                trainer: data?.trainer,
                trainee: data?.trainee,
            };
            const report = new report_schema_1.default(obj).save();
        }
        let fileUrl = await this.generatePreSignedPutUrl(filename, "png");
        if (fileUrl) {
            return responseBuilder_1.ResponseBuilder.data({ url: fileUrl }, l10n.t("REPORT_GENERATED"));
        }
        else {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async cropImage(data) {
        var filename = "file-" + new Date().getTime().toString() + ".png";
        const isReportExist = await report_schema_1.default.findOne({
            sessions: data?.sessions,
            trainee: data?.trainee,
            trainer: data?.trainer,
        });
        if (isReportExist) {
            var newReportData = isReportExist.reportData;
            newReportData = newReportData.map((obj) => {
                if (obj.imageUrl === data.oldFile) {
                    return { ...obj, imageUrl: filename };
                }
                return obj;
            });
            const result = await report_schema_1.default.updateOne({
                sessions: data?.sessions,
                trainee: data?.trainee,
                trainer: data?.trainer,
            }, { reportData: newReportData });
            let fileUrl = await this.generatePreSignedPutUrl(filename, "png");
            if (fileUrl) {
                return responseBuilder_1.ResponseBuilder.data({ url: fileUrl }, l10n.t("REPORT_GENERATED"));
            }
            else {
                return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
            }
        }
    }
    async removeImage(data) {
        const isReportExist = await report_schema_1.default.findOne({
            sessions: data?.sessions,
            trainee: data?.trainee,
            trainer: data?.trainer,
        });
        if (isReportExist) {
            var newReportData = isReportExist.reportData;
            newReportData = newReportData.filter((r) => r.imageUrl !== data.filename);
            const result = await report_schema_1.default.updateOne({
                sessions: data?.sessions,
                trainee: data?.trainee,
                trainer: data?.trainer,
            }, { reportData: newReportData });
            return responseBuilder_1.ResponseBuilder.successMessage("Success");
        }
    }
    async getReport(data) {
        const report = await report_schema_1.default.findOne({
            sessions: data?.sessions,
            trainee: data?.trainee,
            trainer: data?.trainer,
        });
        console.log("===========>", report);
        if (report) {
            return responseBuilder_1.ResponseBuilder.data(report, l10n.t("REPORT_GET"));
        }
        else {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    // public async getAllReport(data: any): Promise<ResponseBuilder> {
    //   // const report = await Report.find(data)
    //   const report = await Report.aggregate([
    //     {
    //       '$match': {
    //         '$or': [
    //           {
    //             'trainee': new mongoose.Types.ObjectId(data?._id)
    //           }, {
    //             'trainer': new mongoose.Types.ObjectId(data?._id)
    //           }
    //         ]
    //       }
    //     },
    //     {
    //       '$lookup': {
    //         'from': 'users',
    //         'localField': 'trainee',
    //         'foreignField': '_id',
    //         'as': 'trainee'
    //       }
    //     },
    //     {
    //       '$unwind': {
    //         'path': '$trainee'
    //       }
    //     },
    //     {
    //       '$lookup': {
    //         'from': 'users',
    //         'localField': 'trainer',
    //         'foreignField': '_id',
    //         'as': 'trainer'
    //       }
    //     },
    //     {
    //       '$unwind': {
    //         'path': '$trainer'
    //       }
    //     },
    //     {
    //       '$lookup': {
    //         'from': 'booked_sessions',
    //         'localField': 'sessions',
    //         'foreignField': '_id',
    //         'as': 'session'
    //       }
    //     },
    //     {
    //       '$unwind': {
    //         'path': '$session'
    //       }
    //     },
    //     {
    //       '$group': {
    //         '_id': {
    //           'year': {
    //             '$year': '$createdAt'
    //           },
    //           'month': {
    //             '$month': '$createdAt'
    //           },
    //           'day': {
    //             '$dayOfMonth': '$createdAt'
    //           }
    //         },
    //         'report': {
    //           '$push': '$$ROOT'
    //         },
    //       }
    //     },
    //     {
    //       "$sort": {
    //         "_id": -1
    //       }
    //     },
    //   ])
    //   if (report?.length) {
    //     return ResponseBuilder.data(report, l10n.t("REPORT_GET"));
    //   } else {
    //     return ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
    //   }
    // }
    async getAllReport(data) {
        try {
            console.log(data, "data");
            //NOTE -we will get data based on this user_id , when we call the api from admin for each trainer and trainee
            const id = data?.user_id || data?._id;
            const traineeIsNotAvailableMatchQuery = {
                $or: [
                    {
                        trainee: new mongoose_1.default.Types.ObjectId(id),
                    },
                    {
                        trainer: new mongoose_1.default.Types.ObjectId(id),
                    },
                ],
            };
            const traineeIsvailableMatchQuery = {
                trainer: new mongoose_1.default.Types.ObjectId(data._id),
                trainee: new mongoose_1.default.Types.ObjectId(data.trainee_id),
            };
            const report = await report_schema_1.default.aggregate([
                {
                    $match: {
                        $and: [
                            data.trainee_id
                                ? traineeIsvailableMatchQuery
                                : traineeIsNotAvailableMatchQuery,
                            {
                                $or: [{ status: true }, { status: { $exists: false } }],
                            },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainee",
                        foreignField: "_id",
                        as: "trainee",
                        pipeline: [
                            {
                                $project: constant_1.Constant.pipelineUser,
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$trainee",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "trainer",
                        foreignField: "_id",
                        as: "trainer",
                        pipeline: [
                            {
                                $project: constant_1.Constant.pipelineUser,
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$trainer",
                    },
                },
                {
                    $lookup: {
                        from: "booked_sessions",
                        localField: "sessions",
                        foreignField: "_id",
                        as: "session",
                    },
                },
                {
                    $unwind: {
                        path: "$session",
                    },
                },
                {
                    $group: {
                        _id: {
                            year: {
                                $year: "$createdAt",
                            },
                            month: {
                                $month: "$createdAt",
                            },
                            day: {
                                $dayOfMonth: "$createdAt",
                            },
                        },
                        report: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $sort: {
                        _id: -1,
                    },
                },
            ]);
            if (report?.length) {
                return responseBuilder_1.ResponseBuilder.data(report, l10n.t("REPORT_GET"));
            }
            else {
                return responseBuilder_1.ResponseBuilder.data([], l10n.t("REPORT_NOT_FOUND"));
            }
        }
        catch (error) {
            console.error("Error in getAllReport.ts", error);
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async deleteReport(id) {
        try {
            if (!mongoose_1.default.isValidObjectId(id)) {
                return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("Invalid ID"));
            }
            var report = await report_schema_1.default.findByIdAndUpdate(id, {
                $set: { status: false },
            });
            if (!report) {
                return responseBuilder_1.ResponseBuilder.badRequest(l10n.t(constance_1.Message.notFoundData));
            }
            return responseBuilder_1.ResponseBuilder.successMessage("Report Deleted successfully");
        }
        catch (error) {
            return responseBuilder_1.ResponseBuilder.errorMessage(l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=reportService.js.map