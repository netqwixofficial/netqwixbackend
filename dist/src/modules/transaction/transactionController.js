"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const transactionService_1 = require("./transactionService");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
class transactionController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.transactionService = new transactionService_1.transactionService();
        this.createPaymentIntent = async (req, res) => {
            try {
                const { amount } = req.body;
                if (!amount) {
                    return res.send({
                        status: constance_1.CONSTANCE.BAD_DATA,
                        msg: "Invalid amount provided amount should be a positive number",
                    });
                }
                const result = await this.transactionService.createPaymentIntent(req.body);
                switch (result.code) {
                    case 200:
                        return res
                            .status(result.code)
                            .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
                    case 400:
                        return res
                            .status(result.code
                            ? result.code
                            : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                            .send({ status: constance_1.CONSTANCE.FAIL, error: result.error["error"] });
                    default:
                        return res
                            .status(result.code)
                            .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
        this.paymentDetailsByPaymentIntentsId = async (req, res) => {
            try {
                const { payment_intent_id } = req.body;
                const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
                return res.status(200).send({ status: constance_1.CONSTANCE.SUCCESS, data: intent });
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
        this.createRefundByIntentId = async (req, res) => {
            try {
                const { payment_intent_id } = req.body;
                const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
                const latest_charge = intent.latest_charge;
                const refund = await stripe.refunds.create({
                    charge: latest_charge,
                    reverse_transfer: true,
                    refund_application_fee: true,
                });
                return res.status(200).send({ status: constance_1.CONSTANCE.SUCCESS, data: refund });
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
    }
}
exports.transactionController = transactionController;
//# sourceMappingURL=transactionController.js.map