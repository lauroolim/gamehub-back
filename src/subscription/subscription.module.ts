import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../shared/database/prisma.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../alerta_email/email.module';

@Module({
  imports: [PrismaModule, UserModule, EmailModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule { }
