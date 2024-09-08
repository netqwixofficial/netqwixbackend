"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = void 0;
const express_1 = require("express");
const userController_1 = require("./userController");
const validate_1 = require("../../validate");
const userValidator_1 = require("./userValidator");
const isValidToken_middleware_1 = require("../../middleware/isValidToken.middleware");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const userMiddleware_1 = require("./userMiddleware");
const isValidMongoMiddleware = new isValidToken_middleware_1.IsValidMongoId();
const route = (0, express_1.Router)();
const userC = new userController_1.userController();
const userM = new userMiddleware_1.userMiddleware();
// const middleware = new Middleware();
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
const V = new validate_1.validator();
route.use([
    (req, res, next) => {
        req.byPassRoute = ['/sign-up', '/stripe-account-verification', '/all-online-user'];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
route.post("/sign-up", V.validate(userValidator_1.signUpModel), userC.createNewUser);
// to update status of booked session
route.put("/update-booked-session/:id", isValidMongoMiddleware.isValidTokenInReqParams, V.validate(userValidator_1.updateBookedStatusModal), userC.updateBookedSession);
// to get scheduled bookings for trainer / trainee
route.get("/scheduled-meetings", userC.getScheduledMeetings);
route.get("/me", userC.getMe);
route.post("/share-clips", userC.shareClips);
route.post("/invite-friend", userC.inviteFriend);
// to add/update rating for trainer and trainee
route.put('/rating', V.validate(userValidator_1.updateRatings), userM.isBookingExist, userC.updateRatings);
// to add trainee clip in booked session
route.put("/add-trainee-clip/:id", isValidMongoMiddleware.isValidTokenInReqParams, userC.addTraineeClip);
route.get("/get-all-trainee", userC.getAllTrainee);
route.get("/get-all-trainer", userC.getAllTrainers);
route.put("/update-trainer-commission", userC.updateTrainerCommossion);
route.post("/register-user-with-stripe", userC.updateIsRegisteredWithStript);
route.put("/update-kyc-status", userC.updateIsKYCCompleted);
route.put("/create-verification-session", userC.createVerificationSessionStripeKYC);
route.get("/booking-list", userC.getAllBooking);
route.get("/booking-list-by-id", userC.getAllBookingById);
route.put("/stripe-account-verification", userC.createStripeAccountVarificationUrl);
route.get("/check-stripe-verification", userC.checkIsKycCompleted);
route.post("/update-refund-status", userC.updateRefundStatus);
route.post("/write-us", userC.captureWriteUs);
route.post("/raise-concern", userC.createRaiseConcern);
route.get("/write-us", userC.getCaptureWriteUs);
route.get("/raise-concern", userC.getRaiseConcern);
route.put("/update-contact-us-status", userC.updateWriteUsTicketStatus);
route.put("/update-raised-concern-ticket", userC.updateRaiseConcernTicketStatus);
route.get("/all-online-user", userC.getAllLatestOnlineUser);
exports.userRoute = route;
//# sourceMappingURL=userRoutes.js.map