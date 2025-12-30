"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmail = void 0;
const dotenv = require("dotenv");
const fs = require("fs");
const lodash_1 = require("lodash");
const path = require("path");
const nodemailer = require("nodemailer");
dotenv.config();
// await SendEmail.sendRawEmail(
//     "meeting",
//     { "{NAME}": "Arjun", "{MEETING_URL}" :"https://google.com"  },
//     ["arjun6597@gmail.com"],
//     "Login",
//   );
class SendEmail {
}
exports.SendEmail = SendEmail;
SendEmail.sendRawEmail = (template = null, replaceData = null, emails, subject, text = null, customHtml = null) => {
    try {
        let html = "";
        if (customHtml) {
            html = customHtml;
        }
        else {
            const templatesDir = path.resolve(`${__dirname}/../`, "templates");
            const content = `${templatesDir}/${template}.html`;
            html = SendEmail.getHtmlContent(content, replaceData);
        }
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            html,
            subject,
            text,
            to: emails,
        };
        const transportObj = {
            auth: {
                pass: process.env.EMAIL_PASSWORD,
                user: process.env.EMAIL_USERNAME,
            },
            host: process.env.EMAIL_HOST,
            port: +process.env.EMAIL_PORT,
        };
        const transporter = nodemailer.createTransport(transportObj);
        transporter.sendMail(mailOptions, (mailSendErr, info) => {
            console.log(`mailSendErr ---- `, mailSendErr);
            console.log(`info ---- `, info);
            if (!mailSendErr) {
                return `Message sent: ${info.response}`;
            }
            else {
                return `Error in sending email: ${mailSendErr}`;
            }
        });
    }
    catch (err) {
        console.log(`Getting Err while sending EMAIL ${JSON.stringify(err)}, template ${template}`);
        return `Getting Err while sending EMAIL ${JSON.stringify(err)}, template ${template}`;
    }
};
SendEmail.getHtmlContent = (filePath, replaceData) => {
    const data = fs.readFileSync(filePath);
    let html = data.toString();
    (0, lodash_1.keys)(replaceData).forEach((key) => {
        html = html.replace(key, replaceData[key]);
    });
    return html;
};
//# sourceMappingURL=sendEmail.js.map