"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Twilio = require("twilio");
const dotenv = require("dotenv");
dotenv.config();
class SMSService {
    constructor() {
        const { SMS_SID, SMS_TOKEN, SMS_NUMBER } = process.env;
        if (!SMS_SID || !SMS_TOKEN || !SMS_NUMBER) {
            throw new Error('Missing SMS configuration in environment variables.');
        }
        this.client = new Twilio(SMS_SID, SMS_TOKEN);
        this.senderNumber = SMS_NUMBER;
    }
    /**
     * Sends an SMS message.
     * @param toNumber - The recipient's phone number.
     * @param smsContent - The content of the SMS message.
     * @returns The result of the message send attempt.
     */
    async sendSMS(toNumber, smsContent) {
        console.log('Starting SMS sending process...');
        try {
            const message = await this.client.messages.create({
                body: smsContent,
                from: this.senderNumber,
                to: toNumber,
            });
            console.log(`SMS sent successfully: ${JSON.stringify(message)}`);
            return message;
        }
        catch (error) {
            console.error(`Error sending SMS: ${error.message}`);
            // throw error;
        }
    }
}
exports.default = SMSService;
//# sourceMappingURL=sms-service.js.map