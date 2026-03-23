"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = void 0;
const l10n = require("jm-ez-l10n");
const constance_1 = require("../config/constance");
class ResponseBuilder {
    static successMessage(msg) {
        const rb = new ResponseBuilder();
        rb.code = 200;
        rb.msg = msg;
        rb.status = constance_1.CONSTANCE.SUCCESS;
        return rb;
    }
    static errorMessage(msg) {
        const rb = new ResponseBuilder();
        rb.code = 500;
        rb.status = constance_1.CONSTANCE.FAIL;
        rb.error = msg != null ? msg : l10n.t("ERR_INTERNAL_SERVER");
        return rb;
    }
    static badRequest(msg, code) {
        const rb = new ResponseBuilder();
        rb.code = code || 400;
        rb.error = msg;
        rb.status = constance_1.CONSTANCE.FAIL;
        return rb;
    }
    static data(result, msg) {
        const rb = new ResponseBuilder();
        rb.code = 200;
        result.message = msg;
        result.status = constance_1.CONSTANCE.SUCCESS;
        rb.result = result;
        rb.msg = msg || null;
        return rb;
    }
    static error(err, msg) {
        const rb = new ResponseBuilder();
        if (err instanceof ResponseBuilder) {
            return err;
        }
        rb.code = 500;
        rb.error = err || l10n.t("ERR_INTERNAL_SERVER");
        rb.status = constance_1.CONSTANCE.FAIL;
        rb.msg = msg || null;
        rb.description = err.description;
        rb.result = err
            ? l10n.t("ERR_THROW_BY_CODE")
            : l10n.t("ERR_INTERNAL_SERVER");
        return rb;
    }
}
exports.ResponseBuilder = ResponseBuilder;
//# sourceMappingURL=responseBuilder.js.map