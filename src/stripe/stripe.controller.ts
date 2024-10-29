import { Controller, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
      event = this.stripeService.constructEventFromWebhook(req.body, sig);
    } catch (err) {
      console.log(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await this.stripeService.handleWebhookEvent(event);
      return res.status(200).send({ received: true });
    } catch (error) {
      throw new HttpException(`Webhook handling error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
