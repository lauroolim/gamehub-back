import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDonationDto } from './dto/create-donation.dto';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PrismaService } from '../shared/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateBenefitDto } from './dto/create-benefit.dto';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class DonationService {
  private client: MercadoPagoConfig;
  private preference: Preference;
  private platformFeePercentage = 5;

  constructor(private readonly prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    this.preference = new Preference(this.client);
  }

  async createDonation(createDonationDto: CreateDonationDto) {
    const donationId = uuidv4();
    const { amount, description, payerEmail, gameId, userId } = createDonationDto;


    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        users: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado.');
    }

    const gameDeveloper = game.users[0];

    if (!gameDeveloper || !gameDeveloper.mercadoPagoAccountId) {
      throw new BadRequestException('O autor do jogo não possui uma conta no Mercado Pago.');
    }

    const preferenceData = {
      items: [
        {
          id: donationId,
          title: description,
          description: description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      payer: {
        email: payerEmail,
      },
      marketplace_fee: (this.platformFeePercentage / 100) * amount,
      purpose: 'wallet_purchase',
      collector_id: gameDeveloper.mercadoPagoAccountId,
    };

    const preference = await this.preference.create({ body: preferenceData });

    const donation = await this.prisma.donation.create({
      data: {
        amount,
        description,
        payerEmail,
        gameId,
        userId,
        token: donationId,
        platformFee: (this.platformFeePercentage / 100) * amount,
        gameDevAmount: amount - (this.platformFeePercentage / 100) * amount,
      },
    });

    return { preferenceId: preference.id, initPoint: preference.init_point };
  }

  async validateDonationToken(token: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { token },
      include: {
        UserGameBenefit: {
          include: {
            benefit: true
          }
        }
      }
    });

    if (!donation) {
      return null;
    }

    if (donation.UserGameBenefit.length === 0) {
      const benefits = await this.getEscalatedBenefits(donation.amount);

      await this.prisma.userGameBenefit.createMany({
        data: benefits.map(benefit => ({
          userId: donation.userId,
          gameId: donation.gameId,
          benefitId: benefit.id,
          donationId: donation.id,
          isActive: true
        }))
      });
    }

    return {
      gameId: donation.gameId,
      userId: donation.userId,
      activeBenefits: donation.UserGameBenefit.filter(ub => ub.isActive).map(ub => ub.benefit)
    };
  }

  private async getEscalatedBenefits(amount: number) {
    return this.prisma.benefit.findMany({
      where: { threshold: { lte: amount } },
      orderBy: { threshold: 'asc' },
    });
  }

  async setBenefit(gameId: number, createBenefitDto: CreateBenefitDto) {
    const { threshold, description } = createBenefitDto;

    return await this.prisma.benefit.create({
      data: {
        gameId,
        threshold,
        description,
      },
    });
  }

  async getBenefits(gameId: number) {
    return this.prisma.benefit.findMany({
      where: { gameId },
      orderBy: { threshold: 'asc' },
    });
  }

  async getTotalDonationsByGameAuthor(gameId: number): Promise<number> {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      select: { userId: true },
    });

    if (!game || !game.userId) {
      throw new NotFoundException('Jogo ou autor não encontrado.');
    }

    const authorId = game.userId;

    const result = await this.prisma.donation.aggregate({
      where: {
        gameId: gameId,
        userId: authorId,
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }

  async getUserTotalDonations(gameId: number, userId: number): Promise<number> {
    const result = await this.prisma.donation.aggregate({
      where: {
        gameId,
        userId,
      },
      _sum: {
        amount: true,
      },
    });
    return result._sum.amount || 0;
  }

  async getGameSupportersCount(gameId: number): Promise<number> {
    const uniqueDonors = await this.prisma.donation.findMany({
      where: {
        gameId: gameId,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return uniqueDonors.length;
  }
}
