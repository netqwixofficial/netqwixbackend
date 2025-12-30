"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsValidMongoId = void 0;
const constance_1 = require("../config/constance");
const l10n = require("jm-ez-l10n");
const mongoose_1 = require("../helpers/mongoose");
class IsValidMongoId {
    constructor() {
        // to check token in param as id is valid mongo ID or not
        this.isValidTokenInReqParams = async (req, res, next) => {
            const { id = undefined } = req['params'];
            if (id && (0, mongoose_1.isValidMongoObjectId)(id)) {
                next();
            }
            else {
                res
                    .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: l10n.t("INVALID_ID") });
                return;
            }
        };
    }
}
exports.IsValidMongoId = IsValidMongoId;
//# sourceMappingURL=isValidToken.middleware.js.map