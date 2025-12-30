"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const reportService_1 = require("./reportService");
class reportController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.reportService = new reportService_1.ReportService();
        this.createReport = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer = _id;
            try {
                const result = await this.reportService.createReport(req.body);
                return res.status(result.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.addImage = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer = _id;
            try {
                const result = await this.reportService.addImage(req.body);
                return res.status(result.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.cropImage = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer = _id;
            try {
                const result = await this.reportService.cropImage(req.body);
                return res.status(result.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.removeImage = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer = _id;
            try {
                const result = await this.reportService.removeImage(req.body);
                return res.status(result.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getReport = async (req, res) => {
            const { _id } = req.authUser;
            req.body.trainer = _id;
            try {
                const result = await this.reportService.getReport(req.body);
                return res.status(result.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllReport = async (req, res) => {
            const { _id, account_type } = req.authUser;
            req.body._id = _id;
            try {
                const result = await this.reportService.getAllReport(req.body);
                return res.status(result.code).send(result);
            }
            catch (err) {
                this.logger.error(err);
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.deleteReport = async (req, res) => {
            const { id } = req.params;
            try {
                const result = await this.reportService.deleteReport(id);
                return res.status(result.code).json({ result });
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
exports.reportController = reportController;
//# sourceMappingURL=reportController.js.map