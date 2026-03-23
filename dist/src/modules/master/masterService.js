"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterService = void 0;
const logger_1 = require("../../../logger");
const responseBuilder_1 = require("../../helpers/responseBuilder");
const master_data_1 = require("../../model/master_data");
const l10n = require("jm-ez-l10n");
class masterService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.getMasterData = async () => {
            try {
                const masterData = await master_data_1.default.find();
                if (!masterData || masterData.length === 0) {
                    return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("DATA_NOT_FOUND"));
                }
                this.log.info(masterData);
                return responseBuilder_1.ResponseBuilder.data(masterData, l10n.t("MASTER_DATA_GET_SUCCESS"));
            }
            catch (error) {
                this.log.error(error);
                return responseBuilder_1.ResponseBuilder.error(error, l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
    }
}
exports.masterService = masterService;
//# sourceMappingURL=masterService.js.map