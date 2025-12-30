"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const lodash_1 = require("lodash");
const l10n = require("jm-ez-l10n");
const authService_1 = require("./authService");
const constance_1 = require("../../config/constance");
const logger_1 = require("../../../logger");
const jwt_1 = require("../../Utils/jwt");
const user_schema_1 = require("../../model/user.schema");
class AuthMiddleware {
    constructor() {
        this.authService = new authService_1.AuthService();
        this.logger = logger_1.log.getLogger();
        this.isUserExist = async (req, res, next) => {
            try {
                const isUserExist = await this.authService.isUserExists(req.body);
                this.logger.info(isUserExist);
                if ((0, lodash_1.isEmpty)(isUserExist)) {
                    next();
                }
                else {
                    return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).send({
                        status: constance_1.CONSTANCE.FAIL,
                        error: l10n.t("ERR_USER_PROFILE_EXIST", {
                            EMAIL: req.body.email,
                        }),
                    });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).send({
                    status: constance_1.CONSTANCE.FAIL,
                    error: error.message || "Internal Server Error",
                });
            }
        };
        this.isUserNotExist = async (req, res, next) => {
            try {
                const isUserExist = await this.authService.isUserExists(req.body);
                this.logger.info(isUserExist);
                if (!(0, lodash_1.isEmpty)(isUserExist)) {
                    req["authUser"] = isUserExist;
                    next();
                }
                else {
                    return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).send({
                        status: constance_1.CONSTANCE.FAIL,
                        error: l10n.t("ERR_USER_PROFILE_NOT_EXIST", {
                            EMAIL: req.body.email,
                        }),
                    });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).send({
                    status: constance_1.CONSTANCE.FAIL,
                    error: error.message || "Internal Server Error",
                });
            }
        };
        this.isGoogleUserExists = async (req, res, next) => {
            try {
                const isGoogleUserExists = await this.authService.isGoogleUserExists(req.body);
                this.logger.info(isGoogleUserExists);
                if ((0, lodash_1.isEmpty)(isGoogleUserExists)) {
                    res.status(constance_1.CONSTANCE.RES_CODE.success).json({
                        data: { ...req.body, isRegistered: false },
                        msg: l10n.t("GOOGLE_LOGIN_REGISTER_PENDING"),
                    });
                }
                else {
                    req.body = isGoogleUserExists;
                    next();
                }
            }
            catch (error) {
                this.logger.error(error);
                return res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).send({
                    status: constance_1.CONSTANCE.FAIL,
                    error: error.message || "Internal Server Error",
                });
            }
        };
        this.loadSocketUser = async (token) => {
            try {
                const tokenInfo = await jwt_1.default.decodeAuthToken(token);
                if (tokenInfo && tokenInfo["user_id"]) {
                    const result = await user_schema_1.default.findOne({ _id: tokenInfo["user_id"] });
                    if (result) {
                        return { user: result, isValidUser: true };
                    }
                    else {
                        return {
                            user: null,
                            isValidUser: false,
                            error: l10n.t("ERR_UNAUTH"),
                        };
                    }
                }
                else {
                    return { user: null, isValidUser: false, error: l10n.t("ERR_UNAUTH") };
                }
            }
            catch (err) {
                return { user: null, isValidUser: false, error: l10n.t("ERR_UNAUTH") };
            }
        };
    }
}
exports.AuthMiddleware = AuthMiddleware;
//# sourceMappingURL=authMiddleware.js.map