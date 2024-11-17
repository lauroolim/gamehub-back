import { Injectable } from '@nestjs/common';
import { CreateDonationDto } from './dto/create-donation.dto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PrismaService } from '../shared/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DonationService {
  private client: MercadoPagoConfig;
  private preference: Preference;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    this.preference = new Preference(this.client);
  }

  async createDonation(createDonationDto: CreateDonationDto) {
    const donationId = uuidv4();
    const { amount, description, payerEmail } = createDonationDto;

    const body = {
      items: [
        {
          id: donationId,
          title: 'Doação',
          description: description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      Back_urls: {
        success: 'http://localhost:3000/success', //depois criar esses endpoints no outro repo lá do nextjs
        failure: 'http://localhost:3000/failure',
        pending: 'http://localhost:3000/pending',
      },
      auto_return: 'all',
      transaction_amount: amount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
      },
    };

    try {
      const response = await this.preference.create({ body });
      return response;
    } catch (error) {
      throw error;
    }
  }
}
