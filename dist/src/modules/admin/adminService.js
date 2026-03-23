"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const logger_1 = require("../../../logger");
const bcrypt_1 = require("../../Utils/bcrypt");
const responseBuilder_1 = require("../../helpers/responseBuilder");
const l10n = require("jm-ez-l10n");
const jwt_1 = require("../../Utils/jwt");
const default_admin_setting_schema_1 = require("../../model/default_admin_setting.schema");
class AdminService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.bcrypt = new bcrypt_1.Bcrypt();
        this.JWT = new jwt_1.default();
    }
    async updateGlobalCommission(reqBody, authUser) {
        const { commission } = reqBody;
        try {
            const adminSetting = await default_admin_setting_schema_1.default.findOneAndUpdate({}, { commission, last_updated_admin_id: authUser._id }, { upsert: true, new: true });
            return responseBuilder_1.ResponseBuilder.data(adminSetting, "Commission Updated!");
        }
        catch (err) {
            return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
    async getGlobalCommission() {
        try {
            const data = await default_admin_setting_schema_1.default.find();
            return responseBuilder_1.ResponseBuilder.data(data, "Global Commission Fetched!");
        }
        catch (error) {
            return responseBuilder_1.ResponseBuilder.error(error, l10n.t("ERR_INTERNAL_SERVER"));
        }
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=adminService.js.map