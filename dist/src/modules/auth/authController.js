"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const logger_1 = require("../../../logger");
const constance_1 = require("../../config/constance");
const userService_1 = require("../user/userService");
const authService_1 = require("./authService");
class authController {
    constructor() {
        this.authService = new authService_1.AuthService();
        this.userService = new userService_1.UserService();
        this.logger = logger_1.log.getLogger();
        this.signup = async (req, res) => {
            try {
                const result = await this.authService.createNewUser(req.body);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const result = await this.authService.login(req.body);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
        this.forgotPasswordEmail = async (req, res) => {
            try {
                const result = await this.authService.forgotPasswordEmail(req.body.email, req["authUser"]);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (error) {
                this.logger.error(error);
                return res
                    .status(error.code ? error.code : constance_1.CONSTANCE.RES_CODE.error.internalServerError)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: error.message });
            }
        };
        this.confirmResetPassword = async (req, res) => {
            try {
                const { token, password } = req.body;
                if (!token || !password) {
                    return res.status(400).json({
                        status: constance_1.CONSTANCE.FAIL,
                        error: "Token and password are required.",
                    });
                }
                const result = await this.authService.confirmForgetPassword(req.body);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (error) {
                this.logger.error(error);
                const statusCode = error.code
                    ? error.code
                    : constance_1.CONSTANCE.RES_CODE.error.internalServerError;
                const errorMessage = error.message;
                return res
                    .status(statusCode)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: errorMessage });
            }
        };
        this.googleLogin = async (req, res) => {
            try {
                const result = await this.authService.googleLogin(req.body);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
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
exports.authController = authController;
//# sourceMappingURL=authController.js.map