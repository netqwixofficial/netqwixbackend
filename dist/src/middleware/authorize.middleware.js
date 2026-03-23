"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizeMiddleware = void 0;
const lodash_1 = require("lodash");
const constance_1 = require("../config/constance");
const l10n = require("jm-ez-l10n");
const jwt_1 = require("../Utils/jwt");
const user_schema_1 = require("../model/user.schema");
class AuthorizeMiddleware {
    constructor() {
        this.authorizeUser = async (req, res, next) => {
            const { byPassRoute } = req;
            console.log(`route --- `, req.path);
            const isRouteExist = !(byPassRoute.includes(req.url) || byPassRoute.includes(req.path));
            console.log(`isRouteExist --- `, isRouteExist);
            const bypasswithoutAuth = ["/get-availability"];
            if (isRouteExist) {
                if (!(0, lodash_1.isEmpty)(req.headers.authorization)) {
                    try {
                        const authRegex = /^Bearer\s+null$/;
                        if (req.headers.authorization && authRegex.test(req.headers.authorization) && bypasswithoutAuth.includes(req.path)) {
                            return next();
                        }
                        const tokenInfo = await jwt_1.default.decodeAuthToken(req.headers.authorization.split(" ")[1]);
                        if (tokenInfo) {
                            const result = await user_schema_1.default.findOne({
                                _id: tokenInfo.user_id,
                            });
                            if (result) {
                                req.authUser = result;
                                next();
                            }
                            else {
                                res
                                    .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                                    .send({ status: constance_1.CONSTANCE.FAIL, error: l10n.t("ERR_UNAUTH") });
                                return;
                            }
                        }
                        else {
                            res
                                .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                                .send({ status: constance_1.CONSTANCE.FAIL, error: l10n.t("ERR_UNAUTH") });
                            return;
                        }
                    }
                    catch (error) {
                        res
                            .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                            .send({ status: constance_1.CONSTANCE.FAIL, error: l10n.t("ERR_UNAUTH") });
                        return;
                    }
                }
                else if (bypasswithoutAuth.includes(req.path)) {
                    next();
                }
                else {
                    res.status(constance_1.CONSTANCE.RES_CODE.error.unauthorized).send({
                        status: constance_1.CONSTANCE.FAIL,
                        error: l10n.t("ERR_UNAUTH"),
                    });
                    return;
                }
            }
            else {
                next();
            }
        };
    }
}
exports.AuthorizeMiddleware = AuthorizeMiddleware;
//# sourceMappingURL=authorize.middleware.js.map