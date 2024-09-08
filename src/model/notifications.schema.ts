import { Schema, model as Model } from "mongoose";
import { Tables } from "../config/tables";

const notificationSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const notification = Model(Tables.notifications, notificationSchema);
export default notification;
