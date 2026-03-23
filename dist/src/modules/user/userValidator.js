"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRatings = exports.updateBookedStatusModal = exports.signUpModel = void 0;
const constance_1 = require("../../config/constance");
const model_1 = require("../../model");
const class_validator_1 = require("class-validator");
class signUpModel extends model_1.model {
    constructor(body) {
        super();
        const { username, email, number, password } = body;
        this.username = username;
        this.email = email;
        this.password = password;
        this.number = number;
    }
}
exports.signUpModel = signUpModel;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], signUpModel.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)()
    // @Validate(  )
], signUpModel.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(10)
], signUpModel.prototype, "number", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], signUpModel.prototype, "password", void 0);
class updateBookedStatusModal extends model_1.model {
    constructor(body) {
        super();
        const { booked_status } = body;
        this.booked_status = booked_status;
    }
}
exports.updateBookedStatusModal = updateBookedStatusModal;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(constance_1.BOOKED_SESSIONS_STATUS)
], updateBookedStatusModal.prototype, "booked_status", void 0);
class updateRatings extends model_1.model {
    constructor(body) {
        super();
        const { sessionRating, booking_id, audioVideoRating, recommendRating, title, remarksInfo } = body;
        this.sessionRating = sessionRating;
        this.audioVideoRating = audioVideoRating;
        this.recommendRating = recommendRating;
        this.title = title;
        this.remarksInfo = remarksInfo;
        this.booking_id = booking_id;
    }
}
exports.updateRatings = updateRatings;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5)
], updateRatings.prototype, "sessionRating", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5)
], updateRatings.prototype, "audioVideoRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], updateRatings.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], updateRatings.prototype, "remarksInfo", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)()
], updateRatings.prototype, "booking_id", void 0);
//# sourceMappingURL=userValidator.js.map