import { Utils } from "../Utils/Utils";
import { CONSTANCE } from "../config/constance";
import { ResponseBuilder } from "./responseBuilder";
import * as l10n from "jm-ez-l10n";

const stripe = require("stripe")(process.env.STRIPE_SECRET);

export class StripeHelper {
  public createPaymentIntent = async (body: any, currency = "usd") => {
    try {
      const { amount, destination, commission, customer } = body;
      
      if (typeof amount !== "number") {
        return ResponseBuilder.badRequest("Invalid amount.");
      }
      if (!CONSTANCE.supportedCurrencies.includes(currency.toLowerCase())) {
        return ResponseBuilder.badRequest("Invalid currency.");
      }

      // const supportedCurrencies = ["usd", "eur", /* Add other supported currencies */];
      // if (!supportedCurrencies.includes(currency.toLowerCase())) {
      //   return ResponseBuilder.badRequest("Invalid currency.");
      // }
  
      // const paymentMethodTypes = [];
      // const acceptedPaymentMethods = {
      //   "usd": ["card", "alipay", "klarna", "amazon_pay", "acss_debit", "cashapp", "link", "wechat_pay"],
      //   "eur": ["eps", "giropay", "p24"]
      //   // Add other accepted payment methods for different currencies
      // };
  
      // if (acceptedPaymentMethods[currency.toLowerCase()]) {
      //   paymentMethodTypes.push(...acceptedPaymentMethods[currency.toLowerCase()]);
      // }

      const stripe_config = {
        // address: 'netquix USA',
        amount: Utils.roundedAmount(amount * 100),
        currency: "usd",
        description: "netquix - trainer fees",
        // TODO: make it dynamic
        shipping: {
          name: "Test user",
          address: {
            line1: "510 Townsend St",
            postal_code: "98140",
            city: "San Francisco",
            state: "CA",
            country: "US",
          },
        },
        // payment_method_types: ['card', 'afterpayClearpay', 'klarna', 'wechatPay', 'sepaDebit'],
        // payment_method_types:  ['card','alipay', 'klarna'],
        // payment_method_types:  ["card", "alipay", "klarna", "amazon_pay", "acss_debit", "cashapp", "link", "wechat_pay"],
        payment_method_types: ['card', 'amazon_pay','cashapp', 'link'],
        // payment_method_types: ['card', 'alipay', 'klarna', 'amazon_pay','cashapp', 'link', 'wechat_pay'],
        // payment_method_types:  ['card', 'alipay', 'klarna', "amazon_pay","acss_debit","cashapp","link", "wechat_pay", "eps", "giropay", "p24"],
        // payment_method_types:  [
        //   "amazon_pay", 
        //   "alipay", 
        //   "alma", 
        //   "affirm", 
        //   "afterpay_clearpay", 
        //   "au_becs_debit", 
        //   "acss_debit", 
        //   "bacs_debit", 
        //   "bancontact", 
        //   "blik", 
        //   "boleto", 
        //   "card", 
        //   "cashapp", 
        //   "crypto", 
        //   "eps", 
        //   "fpx", 
        //   "giropay", 
        //   "grabpay", 
        //   "ideal", 
        //   "klarna", 
        //   "konbini", 
        //   "mobilepay", 
        //   "multibanco", 
        //   "ng_market", 
        //   "nz_bank_account", 
        //   "oxxo", 
        //   "p24", 
        //   "pay_by_bank", 
        //   "paypal", 
        //   "payto", 
        //   "rechnung", 
        //   "sepa_debit", 
        //   "sofort", 
        //   "south_korea_market", 
        //   "kr_market", 
        //   "swish", 
        //   "three_d_secure", 
        //   "twint", 
        //   "upi", 
        //   "us_bank_account", 
        //   "wechat_pay", 
        //   "paynow", 
        //   "pix", 
        //   "promptpay", 
        //   "revolut_pay", 
        //   "netbanking", // Wrap in quotes
        //   "id_bank_transfer", 
        //   "link", 
        //   "demo_pay"
        // ],

        // currency: 'aud',
        customer: customer ?? "",
        // payment_method: defaultPaymentMethod,
        // off_session: true,
        // confirm: true,
        // description: description,
        application_fee_amount: Math.round(amount * Number(commission)),
        transfer_data: {
          destination: destination,
          //  amount: 2 * 100
        },
      }   
      console.log("=====> stripe_config",stripe_config)
      const paymentIntent = await stripe.paymentIntents.create(stripe_config);
      return ResponseBuilder.data(
        paymentIntent,
        l10n.t("TRANSACTION_INTENT_CREATED")
      );
    } catch (err) {
      if (err["statusCode"]) {
        return ResponseBuilder.badRequest(err.raw.message, 400);
      } else {
        return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
      }
    }
  };
}
