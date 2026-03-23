"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileModal = exports.updateSlotsModel = void 0;
const class_validator_1 = require("class-validator");
const model_1 = require("../../../model");
class updateSlotsModel extends model_1.model {
    constructor(body) {
        super();
        const { available_slots } = body;
        this.available_slots = available_slots;
    }
}
exports.updateSlotsModel = updateSlotsModel;
__decorate([
    (0, class_validator_1.IsArray)()
], updateSlotsModel.prototype, "available_slots", void 0);
class updateProfileModal extends model_1.model {
    constructor(body) {
        super();
        const { about, teaching_style, credentials_and_affiliations, curriculum } = body;
        this.about = about || '';
        this.teaching_style = teaching_style || '';
        this.credentials_and_affiliations = credentials_and_affiliations || '';
        this.curriculum = curriculum || '';
    }
}
exports.updateProfileModal = updateProfileModal;
//# sourceMappingURL=updateSlotsValidator.js.map