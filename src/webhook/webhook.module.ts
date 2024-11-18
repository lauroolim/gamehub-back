import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookStrategyManager } from './webhook-strategy.manager';
import { StripeWebhookService } from './strategies/stripe-webhook.service';
import { MercadoPagoWebhookService } from './strategies/mercado-pago-webhook.service';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PrismaModule } from '../shared/database/prisma.module';
import { PrismaService } from '../shared/database/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { ConfigService } from '@nestjs/config';

@Module({
    controllers: [WebhookController],
    imports: [
        SubscriptionModule,
        PrismaModule
    ],
    providers: [
        WebhookStrategyManager,
        StripeWebhookService,
        PrismaService,
        SubscriptionService,
        ConfigService,
    ],
})
export class WebhookModule { }
