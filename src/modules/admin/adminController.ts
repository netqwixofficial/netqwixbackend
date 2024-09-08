import { log } from "./../../../logger";
import { CONSTANCE, Message } from "./../../config/constance";
import { ResponseBuilder } from "./../../helpers/responseBuilder";
import { Request, Response } from "express";
import { AdminService } from "./adminService";

export class AdminController {
  public adminService = new AdminService();
  public logger = log.getLogger();

  public updateGlobalCommission = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.adminService.updateGlobalCommission(req.body, req["authUser"]);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getGlobalCommission = async (req, res) => {
    try {
      const result: ResponseBuilder =  await this.adminService.getGlobalCommission();
      if (result.status !== CONSTANCE.FAIL) {
        res.status(result.code).json(result);
      } else {
        res.status(result.code).json({
          status: result.status,
          error: result.error,
          code: CONSTANCE.RES_CODE.error.badRequest,
        });
      }
    } catch (err) {
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };
}
