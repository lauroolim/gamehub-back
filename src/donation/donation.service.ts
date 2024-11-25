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

    const hasOldDonation = await this.prisma.donation.findFirst({
      where: {
        userId: createDonationDto.userId,
        gameId: createDonationDto.gameId,
      },
    });

    const token = hasOldDonation ? hasOldDonation.token : donationId;


    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Jogo não encontrado.');
    }

    const gameDeveloper = game.userId;

    const gameDeveloperUser = await this.prisma.user.findUnique({
      where: { id: gameDeveloper },
    });

    if (!gameDeveloperUser || !gameDeveloperUser.mercadoPagoAccountId) {
      throw new BadRequestException('O autor do jogo não possui uma conta no Mercado Pago.');
    }

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

    const totalDonated = await this.prisma.donation.aggregate({
      where: {
        userId,
        gameId,
      },
      _sum: {
        amount: true,
      },
    });

    const totalAmount = totalDonated._sum.amount || 0;

    const allEligibleBenefits = await this.prisma.benefit.findMany({
      where: {
        gameId,
        threshold: {
          lte: totalAmount,
        },
      },
      orderBy: {
        threshold: 'asc',
      },
    });

    const existingBenefits = await this.prisma.userGameBenefit.findMany({
      where: {
        userId,
        gameId,
      },
      select: {
        benefitId: true,
      },
    });

    const existingBenefitIds = existingBenefits.map((b) => b.benefitId);

    const newBenefits = allEligibleBenefits.filter(
      (benefit) => !existingBenefitIds.includes(benefit.id),
    );

    if (newBenefits.length > 0) {
      await this.prisma.userGameBenefit.createMany({
        data: newBenefits.map((benefit) => ({
          userId,
          gameId,
          benefitId: benefit.id,
          donationId: donation.id,
          isActive: true,
        })),
      });
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
      collector_id: gameDeveloperUser.mercadoPagoAccountId,
      payment_methods: {
        default_payment_method_id: 'pix',
      },
    };

    const preference = await this.preference.create({ body: preferenceData });

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      token: token,
    };
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

  async benefitsByUserGame(userId: number, gameId: number) {
    const benefits = await this.prisma.userGameBenefit.findMany({
      where: {
        userId,
        gameId,
        isActive: true
      },
      include: {
        benefit: true
      }
    });

    const totalInvested = await this.prisma.donation.aggregate({
      where: {
        userId,
        gameId
      },
      _sum: {
        amount: true
      }
    });

    return {
      benefits,
      totalInvested: totalInvested._sum.amount || 0
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

    const result = await this.prisma.donation.aggregate({
      where: {
        gameId: gameId,
      },
      _sum: {
        gameDevAmount: true,
      },
    });

    return result._sum.gameDevAmount || 0;
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
