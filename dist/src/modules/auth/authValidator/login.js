"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmResetPasswordModal = exports.forgotPasswordEmailModal = exports.loginModel = void 0;
const class_validator_1 = require("class-validator");
const model_1 = require("../../../model");
class loginModel extends model_1.model {
    constructor(body) {
        super();
        const { email, password } = body;
        this.email = email;
        this.password = password;
    }
}
exports.loginModel = loginModel;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)()
], loginModel.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], loginModel.prototype, "password", void 0);
class forgotPasswordEmailModal extends model_1.model {
    constructor(body) {
        super();
        const { email } = body;
        this.email = email;
    }
}
exports.forgotPasswordEmailModal = forgotPasswordEmailModal;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)()
], forgotPasswordEmailModal.prototype, "email", void 0);
class confirmResetPasswordModal extends model_1.model {
    constructor(body) {
        super();
        const { token, password } = body;
        this.token = token;
        this.password = password;
    }
}
exports.confirmResetPasswordModal = confirmResetPasswordModal;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)()
], confirmResetPasswordModal.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)()
], confirmResetPasswordModal.prototype, "password", void 0);
//# sourceMappingURL=login.js.map