import { model } from "../../model";

import {
  IsNotEmpty,
  IsNumber,
} from "class-validator";

export class createPaymentIntent extends model {
  @IsNotEmpty()
  @IsNumber()
  public amount: number;

  constructor(body) {
    super();
    const { amount } = body;
    this.amount = amount;
  }
}
