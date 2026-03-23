"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const responseBuilder_1 = require("../helpers/responseBuilder");
const l10n = require("jm-ez-l10n");
class JWT {
    constructor() {
        this.signJWT = (payload) => {
            let jwtSecretKey = process.env.JWT_SECRET;
            return jwt.sign(payload, jwtSecretKey, {
                expiresIn: process.env.JWT_EXPIRATION_TIME,
            });
        };
    }
    /*
     * decodeAuthToken
     */
    static decodeAuthToken(token) {
        const decodedToken = jwt.decode(token);
        if (decodedToken) {
            return decodedToken;
        }
        else {
            throw responseBuilder_1.ResponseBuilder.badRequest(l10n.t("NOT_VERIFIED_TOKEN"));
        }
    }
}
exports.default = JWT;
//# sourceMappingURL=jwt.js.map