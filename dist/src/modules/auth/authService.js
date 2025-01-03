"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const logger_1 = require("../../../logger");
const bcrypt_1 = require("../../Utils/bcrypt");
const responseBuilder_1 = require("../../helpers/responseBuilder");
const authEnum_1 = require("./authEnum");
const l10n = require("jm-ez-l10n");
const jwt_1 = require("../../Utils/jwt");
const user_schema_1 = require("../../model/user.schema");
const sendEmail_1 = require("../../Utils/sendEmail");
const constance_1 = require("../../config/constance");
const stripeHelperController_1 = require("../stripe/stripeHelperController");
const default_admin_setting_schema_1 = require("../../model/default_admin_setting.schema");
const referred_user_schema_1 = require("../../model/referred.user.schema");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
class AuthService {
    constructor() {
        this.log = logger_1.log.getLogger();
        this.bcrypt = new bcrypt_1.Bcrypt();
        this.JWT = new jwt_1.default();
        this.createNewUser = async (createUser) => {
            this.log.info(createUser);
            let hashPassword;
            let account;
            console.log("creating new user", createUser);
            // Check if a referred user with this email exists
            const referredUser = await referred_user_schema_1.default.findOne({ email: createUser.email });
            if (createUser.password) {
                hashPassword = await this.bcrypt.getHashedPassword(createUser.password);
            }
            if (createUser.account_type === authEnum_1.AccountType.TRAINER) {
                account = await stripeHelperController_1.stripeHelperController.createAccount(createUser);
            }
            else if (createUser.account_type === authEnum_1.AccountType.TRAINEE) {
                account = await stripeHelperController_1.stripeHelperController.createCustomer(createUser);
            }
            const global_commission = await default_admin_setting_schema_1.default.findOne();
            let updateduserObj = {
                ...createUser,
                password: createUser.password ? hashPassword : null,
                login_type: Boolean(createUser.isGoogleRegister)
                    ? authEnum_1.LoginType.GOOGLE
                    : authEnum_1.LoginType.DEFAULT,
                is_registered_with_stript: account?.id ? true : false,
                stripe_account_id: account?.id,
                commission: global_commission?.commission ?? 0,
            };
            if (createUser.account_type === authEnum_1.AccountType.TRAINER) {
                updateduserObj = {
                    ...updateduserObj,
                    extraInfo: {
                        availabilityInfo: {
                            availability: {
                                Sun: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Mon: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Tue: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Wed: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Thu: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Fri: [{ start: "9:00 AM", end: "5:00 PM" }],
                                Sat: [{ start: "9:00 AM", end: "5:00 PM" }],
                            },
                            selectedDuration: 15,
                            timeZone: "America/New_York",
                        },
                        hourly_rate: "20"
                    },
                };
            }
            delete createUser.isGoogleRegister;
            // Create the user object, but replace its _id if referredUser exists
            const userObj = referredUser
                ? new user_schema_1.default({ ...updateduserObj, _id: referredUser._id }) // Use referred user's _id
                : new user_schema_1.default(updateduserObj); // Create a new user normally
            await userObj.save();
            // Remove the referred user from the ReferredUser collection if it was created from there
            if (referredUser) {
                await referred_user_schema_1.default.deleteOne({ _id: referredUser._id });
            }
            // SendEmail.sendRawEmail(
            //   null,
            //   "",
            //   [createUser.email],
            //   "Welcome to NetQwix's Training Portal",
            //   null,
            //   `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
            //     Welcome  <i  style='color:#aebf76'>${createUser.fullname}</i>
            //     <br/><br/>
            //     Thank you for joining NetQwix Training Team. We look forward to you using this platform
            //     to connect with new NetQwix Team Members.
            //     <br/><br/>
            //     Please <u style='color:#aebf76'><a href=${process.env.FRONTEND_URL}>click here</a></u> 
            //     to log in and set up your Trainer Profile and set your Schedule Availability.
            //     <br/><br/>
            //     Team NetQwix. 
            //     <br/>
            //     <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
            //     </div> `
            // );
            const emailTemplate = createUser.account_type === authEnum_1.AccountType.TRAINER
                ? "trainer-join"
                : "trainee-join";
            sendEmail_1.SendEmail.sendRawEmail(emailTemplate, null, [createUser.email], "Welcome to NetQwix!", "Thank you for joining!");
            return responseBuilder_1.ResponseBuilder.data(userObj, l10n.t("USER_CREATED_SUCCESS"));
        };
        this.getUser = async (newUser) => {
            try {
                const { email } = newUser;
                if (!email) {
                    return responseBuilder_1.ResponseBuilder.badRequest("Email is required.");
                }
                return await user_schema_1.default.findOne({ email }).select('+password');
            }
            catch (err) {
                return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
        this.login = async (user) => {
            try {
                const { email, password } = user;
                if (!email) {
                    return responseBuilder_1.ResponseBuilder.badRequest("Email is required.");
                }
                if (!password) {
                    return responseBuilder_1.ResponseBuilder.badRequest("Password is required.");
                }
                const userDetails = await this.getUser(user);
                if (userDetails) {
                    const validPassword = await this.bcrypt.comparePassword(password, userDetails.password);
                    if (validPassword) {
                        const payload = {
                            user_id: userDetails._id,
                            account_type: userDetails.account_type,
                        };
                        const access_token = this.JWT.signJWT(payload);
                        //TODO: Store access_token in DB
                        return responseBuilder_1.ResponseBuilder.data({ data: { access_token, account_type: userDetails.account_type } }, l10n.t("LOGIN_SUCCESSFULL"));
                    }
                    else {
                        return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("INVALID_CREDENTIAL"));
                    }
                }
                else {
                    return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("INVALID_CREDENTIAL"));
                }
            }
            catch (err) {
                return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
        this.isUserExists = async (newUser) => {
            try {
                if (!newUser.email) {
                    responseBuilder_1.ResponseBuilder.badRequest("Email is required.");
                }
                this.log.info(newUser);
                return await user_schema_1.default.exists({
                    email: newUser.email,
                });
            }
            catch (error) {
                responseBuilder_1.ResponseBuilder.error(error, l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
        this.forgotPasswordEmail = async (email, authUser) => {
            try {
                const userInfo = await user_schema_1.default.findById(authUser["_id"]);
                if (!userInfo) {
                    return responseBuilder_1.ResponseBuilder.errorMessage("User not found.");
                }
                const token = this.JWT.signJWT({
                    user_id: authUser["_id"],
                    account_type: userInfo.account_type,
                });
                const url = `${process.env.FRONTEND_URL}/auth/verified-forget-password?token=${token}`;
                sendEmail_1.SendEmail.sendRawEmail(null, null, [email], "Change NetQwix Training Portal Password", null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
      Hello <i  style='color:#ff0000'>${userInfo.fullname},</i>
      <br/>
      To proceed with the password reset, kindly <a href=${url}>click here.</a>
      <br/>
      NetQwix Security.
      <br/>
      <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
       </div> `);
                return responseBuilder_1.ResponseBuilder.data({}, l10n.t("RESET_PASSWORD_MAIL_SEND"));
            }
            catch (err) {
                return responseBuilder_1.ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
        this.confirmForgetPassword = async (authUser) => {
            try {
                const { password, token } = authUser;
                if (!password || !token) {
                    return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("MISSING_PARAMETERS"));
                }
                const hashedPassword = await this.bcrypt.getHashedPassword(password);
                const decodedToken = await jwt_1.default.decodeAuthToken(token);
                if (!decodedToken || !decodedToken["user_id"]) {
                    return responseBuilder_1.ResponseBuilder.badRequest(l10n.t("NOT_VERIFIED_TOKEN"));
                }
                const updatedUser = await user_schema_1.default.findOneAndUpdate({ _id: decodedToken["user_id"] }, { $set: { password: hashedPassword } }, { new: true });
                if (!updatedUser) {
                    return responseBuilder_1.ResponseBuilder.error(l10n.t("USER_NOT_FOUND"));
                }
                return responseBuilder_1.ResponseBuilder.data({ data: updatedUser }, l10n.t("PASSWORD_RESET_SUCCESS"));
            }
            catch (err) {
                console.error("Error in confirmResetPassword:", err);
                if (err.code === constance_1.CONSTANCE.RES_CODE.error.badRequest) {
                    return responseBuilder_1.ResponseBuilder.error(l10n.t("NOT_VERIFIED_TOKEN"));
                }
                else {
                    console.error("Error in confirmResetPassword:", err);
                    return responseBuilder_1.ResponseBuilder.error(l10n.t("ERR_INTERNAL_SERVER"));
                }
            }
        };
        this.isGoogleUserExists = async (googleUser) => {
            try {
                const { email } = googleUser;
                if (!email) {
                    return responseBuilder_1.ResponseBuilder.badRequest("Email is required.");
                }
                return await user_schema_1.default.findOne({ email });
            }
            catch (error) {
                return responseBuilder_1.ResponseBuilder.error(l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
        this.googleLogin = async (user) => {
            try {
                const payload = {
                    user_id: user._id,
                    account_type: user.account_type,
                };
                const access_token = this.JWT.signJWT(payload);
                //TODO: Store access_token in DB
                return responseBuilder_1.ResponseBuilder.data({ data: { access_token, account_type: user.account_type } }, l10n.t("LOGIN_SUCCESSFULL"));
            }
            catch (error) {
                return responseBuilder_1.ResponseBuilder.error(l10n.t("ERR_INTERNAL_SERVER"));
            }
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map