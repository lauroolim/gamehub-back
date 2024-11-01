import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { PrismaService } from '../shared/database/prisma.service';
import { SubscriptionModule } from '../subscription/subscription.module';


@Module({
  controllers: [StripeController],
  providers: [StripeService, PrismaService],
  imports: [SubscriptionModule],
})
export class StripeModule { }
