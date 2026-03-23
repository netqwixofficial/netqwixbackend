"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = void 0;
const logger_1 = require("../../../logger");
const responseBuilder_1 = require("../../helpers/responseBuilder");
const stripe_1 = require("../../helpers/stripe");
const l10n = require("jm-ez-l10n");
class transactionService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.stripeHelper = new stripe_1.StripeHelper();
        this.createPaymentIntent = async (body) => {
            try {
                const result = await this.stripeHelper.createPaymentIntent(body);
                switch (result.code) {
                    case 200:
                        return responseBuilder_1.ResponseBuilder.data(result, l10n.t("TRANSACTION_INTENT_CREATED"));
                    case 400:
                        return responseBuilder_1.ResponseBuilder.badRequest(result, 400);
                    default:
                        return responseBuilder_1.ResponseBuilder.data(result, l10n.t("TRANSACTION_INTENT_CREATED"));
                }
            }
            catch (err) {
                throw err;
            }
        };
    }
}
exports.transactionService = transactionService;
//# sourceMappingURL=transactionService.js.map