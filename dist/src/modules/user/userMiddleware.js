"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const constance_1 = require("../../config/constance");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const mongoose_1 = require("../../helpers/mongoose");
class userMiddleware {
    constructor() {
        this.IsUserExist = async (body) => {
            return true;
        };
        this.createNewUser = async (body) => {
            return;
        };
        this.isBookingExist = async (req, res, next) => {
            const { booking_id } = req.body;
            if ((0, mongoose_1.isValidMongoObjectId)(booking_id)) {
                const bookedSessionInfo = await booked_sessions_schema_1.default.findById(booking_id);
                if (bookedSessionInfo && bookedSessionInfo._id) {
                    req.booked_session_info = bookedSessionInfo;
                    next();
                }
                else {
                    res
                        .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                        .send({ status: constance_1.CONSTANCE.FAIL, error: 'invalid booking id' });
                }
            }
            else {
                res
                    .status(constance_1.CONSTANCE.RES_CODE.error.unauthorized)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: 'invalid booking id' });
            }
        };
    }
}
exports.userMiddleware = userMiddleware;
//# sourceMappingURL=userMiddleware.js.map