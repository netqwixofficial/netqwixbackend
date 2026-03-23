"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const masterService_1 = require("./masterService");
class masterController {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.masterService = new masterService_1.masterService();
        this.getMasterData = async (req, res) => {
            try {
                const result = await this.masterService.getMasterData();
                if (result.status === constance_1.CONSTANCE.FAIL) {
                    return res
                        .status(result.code)
                        .json({ status: constance_1.CONSTANCE.FAIL, error: result.error });
                }
                else {
                    return res
                        .status(result.code)
                        .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
    }
}
exports.masterController = masterController;
//# sourceMappingURL=masterController.js.map