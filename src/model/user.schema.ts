import { Schema, model as Model } from "mongoose";
import { Tables } from "../config/tables";
import { AccountType, LoginType } from "../modules/auth/authEnum";

const userSchema: Schema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // This line excludes password from toJSON output
    },
    mobile_no: {
      type: String,
    },
    account_type: {
      type: String,
      enum: AccountType,
    },
    login_type: {
      type: String,
      enum: LoginType,
      default: LoginType.DEFAULT,
    },
    profile_picture: {
      type: String,
      // default: "https://netquix-ui.vercel.app/user.jpg",
    },
    category: {
      type: String,
    },
    wallet_amount: {
      type: Number,
      default: 0,
    },
    extraInfo: {
      type: Object,
      default: {},
    },
    commission: {
      type: String,
    },
    is_registered_with_stript: { type: Boolean, default: false },
    is_kyc_completed: { type: Boolean, default: false },
    stripe_account_id: {
      type: String,
    },
    subscriptionId : {
      type: String,
      default : null
    }
  },
  { timestamps: true }
);

// Add the toJSON method to the schema
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const user = Model(Tables.user, userSchema);
export default user;
