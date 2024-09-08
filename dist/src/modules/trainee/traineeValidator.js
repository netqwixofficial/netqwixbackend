"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSlotExistModal = exports.bookInstantMeetingModal = exports.bookSessionModal = void 0;
const constance_1 = require("../../config/constance");
const model_1 = require("../../model");
const l10n = require("jm-ez-l10n");
const class_validator_1 = require("class-validator");
const userValidatorConstraints_1 = require("../user/userValidatorConstraints");
class bookSessionModal extends model_1.model {
    constructor(body) {
        super();
        const { trainer_id, status, booked_date, session_start_time, session_end_time, charging_price, } = body;
        this.trainer_id = trainer_id;
        this.status = status;
        this.booked_date = booked_date;
        this.session_start_time = session_start_time;
        this.session_end_time = session_end_time;
        this.session_link = null;
        this.charging_price = charging_price;
    }
}
exports.bookSessionModal = bookSessionModal;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], bookSessionModal.prototype, "trainer_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(constance_1.BOOKED_SESSIONS_STATUS)
], bookSessionModal.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)()
], bookSessionModal.prototype, "booked_date", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], bookSessionModal.prototype, "session_start_time", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], bookSessionModal.prototype, "session_end_time", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)()
], bookSessionModal.prototype, "session_link", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)()
], bookSessionModal.prototype, "charging_price", void 0);
class bookInstantMeetingModal extends model_1.model {
    constructor(body) {
        super();
        const { trainer_id, booked_date } = body;
        this.trainer_id = trainer_id;
        this.booked_date = booked_date;
    }
}
exports.bookInstantMeetingModal = bookInstantMeetingModal;
__decorate([
    (0, class_validator_1.Validate)(userValidatorConstraints_1.IsUserTrainer, { message: l10n.t("NOT_A_TRAINER") }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], bookInstantMeetingModal.prototype, "trainer_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)()
], bookInstantMeetingModal.prototype, "booked_date", void 0);
class checkSlotExistModal extends model_1.model {
    constructor(body) {
        super();
        const { trainer_id, slotTime, booked_date } = body;
        this.slotTime = slotTime;
        this.trainer_id = trainer_id;
        this.booked_date = booked_date;
    }
}
exports.checkSlotExistModal = checkSlotExistModal;
__decorate([
    (0, class_validator_1.Validate)(userValidatorConstraints_1.IsUserTrainer, { message: l10n.t("NOT_A_TRAINER") }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)()
], checkSlotExistModal.prototype, "trainer_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)()
], checkSlotExistModal.prototype, "slotTime", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)()
], checkSlotExistModal.prototype, "booked_date", void 0);
//# sourceMappingURL=traineeValidator.js.map