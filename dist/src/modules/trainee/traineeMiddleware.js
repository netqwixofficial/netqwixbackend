"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraineeMiddleware = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const authEnum_1 = require("../auth/authEnum");
const l10n = require("jm-ez-l10n");
class TraineeMiddleware {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.isTrainee = async (req, res, next) => {
            this.logger.info(req.authUser);
            if (req.authUser.account_type === authEnum_1.AccountType.TRAINEE) {
                next();
            }
            else {
                res
                    .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: l10n.t("ERR_UNAUTH") });
                return;
            }
        };
    }
}
exports.TraineeMiddleware = TraineeMiddleware;
//# sourceMappingURL=traineeMiddleware.js.map