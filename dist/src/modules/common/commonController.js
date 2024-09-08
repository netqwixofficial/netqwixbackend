"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonController = void 0;
const logger_1 = require("../../../logger");
const commonService_1 = require("./commonService");
const constance_1 = require("../../config/constance");
class commonController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.commonService = new commonService_1.commonService();
        this.uploads = async (req, res) => {
            try {
                const response = await this.commonService.uploadFile(req, res);
                return response;
                // res.status(CONSTANCE.RES_CODE.success).json(response)
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code
                    ? error.code
                    : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res
                    .status(statusCode)
                    .json({ status: "error", message: errorMessage });
            }
        };
        this.videoUploadUrl = async (req, res) => {
            try {
                const response = await this.commonService.videoUploadUrl(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.profileImageUrl = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const response = await this.commonService.profileImageUrl(req, res);
                    return response;
                }
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.generateThumbnail = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const response = await this.commonService.generateThumbnail(req, res);
                    return response;
                }
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.sessionsVideoUploadUrl = async (req, res) => {
            try {
                const response = await this.commonService.sessionsVideoUploadUrl(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.getAllSavedSession = async (req, res) => {
            try {
                const response = await this.commonService.getAllSavedSession(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.pdfUploadUrl = async (req, res) => {
            try {
                const response = await this.commonService.pdfUploadUrl(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.getClips = async (req, res) => {
            try {
                const response = await this.commonService.getClips(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.traineeClips = async (req, res) => {
            try {
                const response = await this.commonService.traineeClips(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.deleteClip = async (req, res) => {
            try {
                const response = await this.commonService.deleteClip(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
        this.deleteSavedSession = async (req, res) => {
            try {
                const response = await this.commonService.deleteSavedSession(req, res);
                return response;
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message || "Internal Server Error";
                return res.status(statusCode).json({ status: "error", message: errorMessage });
            }
        };
    }
}
exports.commonController = commonController;
//# sourceMappingURL=commonController.js.map