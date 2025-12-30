"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonRoute = void 0;
const express_1 = require("express");
const commonController_1 = require("./commonController");
const multer = require("multer");
const fs = require("fs");
const authorize_middleware_1 = require("../../middleware/authorize.middleware");
const uploadDirectory = "./uploads";
const authorizeMiddleware = new authorize_middleware_1.AuthorizeMiddleware();
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}
const destination = (req, file, cb) => {
    cb(null, uploadDirectory);
};
const filename = (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
};
const storage = multer.diskStorage({
    destination,
    filename,
});
const upload = multer({ storage });
// const thumbnailUpload = multer({ dest: 'uploads/' });
const route = (0, express_1.Router)();
route.use([
    (req, res, next) => {
        req.byPassRoute = ['/sign-up'];
        next();
    },
    authorizeMiddleware.authorizeUser,
]);
const commonC = new commonController_1.commonController();
route.post("/upload", upload.single("files"), commonC.uploads);
route.post("/video-upload-url", commonC.videoUploadUrl);
route.post("/saved-sessions-upload-url", commonC.sessionsVideoUploadUrl);
route.post("/get-all-saved-sessions", commonC.getAllSavedSession);
route.post("/pdf-upload-url", commonC.pdfUploadUrl);
route.post("/get-clips", commonC.getClips);
route.post("/trainee-clips", commonC.traineeClips);
route.delete('/delete-clip/:id', commonC.deleteClip);
route.delete('/delete-saved-session/:id', commonC.deleteSavedSession);
route.put("/update-profile-picture", commonC.profileImageUrl);
route.post("/generate-thumbnail", upload.single('video'), commonC.generateThumbnail);
exports.commonRoute = route;
//# sourceMappingURL=commonRoutes.js.map