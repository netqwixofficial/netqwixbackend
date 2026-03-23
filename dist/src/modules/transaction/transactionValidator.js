"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const model_1 = require("../../model");
const class_validator_1 = require("class-validator");
class createPaymentIntent extends model_1.model {
    constructor(body) {
        super();
        const { amount, couponCode } = body;
        this.amount = amount;
        this.couponCode = couponCode;
    }
}
exports.createPaymentIntent = createPaymentIntent;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)()
], createPaymentIntent.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], createPaymentIntent.prototype, "couponCode", void 0);
//# sourceMappingURL=transactionValidator.js.map