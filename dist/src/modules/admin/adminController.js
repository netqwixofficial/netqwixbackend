"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const logger_1 = require("./../../../logger");
const constance_1 = require("./../../config/constance");
const adminService_1 = require("./adminService");
class AdminController {
    constructor() {
        this.adminService = new adminService_1.AdminService();
        this.logger = logger_1.log.getLogger();
        this.updateGlobalCommission = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.adminService.updateGlobalCommission(req.body, req["authUser"]);
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
            }
            catch (err) {
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getGlobalCommission = async (req, res) => {
            try {
                const result = await this.adminService.getGlobalCommission();
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
            catch (err) {
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map