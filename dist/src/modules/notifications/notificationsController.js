"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const notificationsService_1 = require("./notificationsService");
class NotificationsController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.notificationsService = new notificationsService_1.NotificationsService();
        this.getPublicKey = async (req, res) => {
            try {
                const data = await this.notificationsService.getPublicKey();
                return res.status(data.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: data.result });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(err.code).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getSubscription = async (req, res) => {
            try {
                const data = await this.notificationsService.getSubscription(req);
                return res.status(data.code).send({ status: constance_1.CONSTANCE.SUCCESS, });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(err.code).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getNotifications = async (req, res) => {
            try {
                console.log(req, 'req');
                const data = await this.notificationsService.getNotifications(req);
                return res.status(data.code).send({ status: constance_1.CONSTANCE.SUCCESS, data: data.result });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(err.code).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateNotificationsStatus = async (req, res) => {
            try {
                const data = await this.notificationsService.updateNotificationsStatus(req);
                return res.status(data.code).send({ status: constance_1.CONSTANCE.SUCCESS, });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(err.code).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
    }
}
exports.NotificationsController = NotificationsController;
//# sourceMappingURL=notificationsController.js.map