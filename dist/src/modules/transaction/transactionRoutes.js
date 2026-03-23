"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoute = void 0;
const express_1 = require("express");
const transactionController_1 = require("./transactionController");
const validate_1 = require("../../validate");
const transactionValidator_1 = require("./transactionValidator");
const route = (0, express_1.Router)();
const transactionC = new transactionController_1.transactionController();
const V = new validate_1.validator();
route.post("/create-payment-intent", V.validate(transactionValidator_1.createPaymentIntent), transactionC.createPaymentIntent);
route.post("/get-payment-intent", transactionC.paymentDetailsByPaymentIntentsId);
route.post("/create-refund", transactionC.createRefundByIntentId);
exports.transactionRoute = route;
//# sourceMappingURL=transactionRoutes.js.map