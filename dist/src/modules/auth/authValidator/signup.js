"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupModel = void 0;
const class_validator_1 = require("class-validator");
const authEnum_1 = require("../authEnum");
const model_1 = require("../../../model");
class signupModel extends model_1.model {
    constructor(body) {
        super();
        const { fullname, email, mobile_no, password, account_type, category, isGoogleRegister, } = body;
        this.fullname = fullname;
        this.email = email;
        this.password = password;
        this.mobile_no = mobile_no;
        this.account_type = account_type;
        this.category = category;
        this.isGoogleRegister = isGoogleRegister;
    }
}
exports.signupModel = signupModel;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], signupModel.prototype, "fullname", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)()
], signupModel.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)()
], signupModel.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)()
], signupModel.prototype, "mobile_no", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(authEnum_1.AccountType)
], signupModel.prototype, "account_type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)()
], signupModel.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)()
], signupModel.prototype, "isGoogleRegister", void 0);
//# sourceMappingURL=signup.js.map