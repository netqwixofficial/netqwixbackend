"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoute = void 0;
const express_1 = require("express");
const authController_1 = require("./authController");
const validate_1 = require("../../validate");
const signup_1 = require("./authValidator/signup");
const login_1 = require("./authValidator/login");
const authMiddleware_1 = require("./authMiddleware");
const googleSignIn_1 = require("./authValidator/googleSignIn");
const route = (0, express_1.Router)();
const authC = new authController_1.authController();
const authMiddleware = new authMiddleware_1.AuthMiddleware();
const V = new validate_1.validator();
//TODO: add middleware
route.post("/signup", V.validate(signup_1.signupModel), authMiddleware.isUserExist, authC.signup);
route.post("/login", V.validate(login_1.loginModel), authC.login);
// to send email for forgot password
route.post("/forgot-password", V.validate(login_1.forgotPasswordEmailModal), authMiddleware.isUserNotExist, authC.forgotPasswordEmail);
//
route.put("/confirm-reset-password", V.validate(login_1.confirmResetPasswordModal), authC.confirmResetPassword);
route.post("/verify-google-login", V.validate(googleSignIn_1.googleLoginModel), authMiddleware.isGoogleUserExists, authC.googleLogin);
exports.authRoute = route;
//# sourceMappingURL=authRoutes.js.map