"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpFailure = exports.Failure = void 0;
const constance_1 = require("./../config/constance");
const l10n = require("jm-ez-l10n");
class Failure extends Error {
    static error(err, data) {
        if (err instanceof SpFailure) {
            err.data = err.data === undefined ? data : err.data;
            return err;
        }
        if (err instanceof Failure) {
            err.type = err.type ? err.type : constance_1.CONSTANCE.BAD_DATA;
            err.data = err.data === undefined ? data : err.data;
            return err;
        }
        const error = new Failure(l10n.t("ERR_INTERNAL_SERVER"), "Error is thrown by code", err, false, data);
        error.type = constance_1.CONSTANCE.CODE;
        error.errorStack = err;
        error.data = data;
        return error;
    }
    static spError(err, isSpError) {
        if (err instanceof Failure) {
            err.type = isSpError ? constance_1.CONSTANCE.CODE : constance_1.CONSTANCE.BAD_DATA;
            return err;
        }
        const error = new Failure(l10n.t("ERR_INTERNAL_SERVER"), "Error is thrown by code");
        error.type = constance_1.CONSTANCE.CODE;
        error.errorStack = err;
        return error;
    }
    static throwApiError(response) {
        if (response && response.responseCode === "01") {
            return new Failure(response.responseDescription || l10n.t("ERR_THIRD_PARTY"), response.responseDescription || l10n.t("ERR_THIRD_PARTY"), response, false);
        }
        return new Failure(l10n.t("ERR_THIRD_PARTY"), response.responseDescription || l10n.t("ERR_THIRD_PARTY"), response, false);
    }
    // Better approach need to be found for type
    constructor(title, description, errStack, isError, data) {
        super(title);
        this.title = title;
        this.type = isError ? constance_1.CONSTANCE.CODE : constance_1.CONSTANCE.BAD_DATA;
        this.description = description;
        if (errStack) {
            this.errorStack = errStack;
        }
        if (data) {
            this.data = data;
        }
    }
}
exports.Failure = Failure;
class SpFailure extends Failure {
    constructor(title, description, isSpError, data) {
        super(title, description);
        super.type = isSpError ? constance_1.CONSTANCE.CODE : constance_1.CONSTANCE.BAD_DATA;
        super.data = data;
    }
}
exports.SpFailure = SpFailure;
//# sourceMappingURL=error.js.map