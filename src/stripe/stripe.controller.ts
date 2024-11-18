import { Controller, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'] as string;
    const payload = req.body;

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructEventFromWebhook(payload, sig);
    } catch (err) {
      console.error(`Erro ao verificar assinatura: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await this.stripeService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error(`Erro ao processar evento: ${error.message}`);
      res.status(500).send(`Webhook handler error: ${error.message}`);
    }
  }
}
