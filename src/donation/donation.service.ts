import { Injectable } from '@nestjs/common';
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

    const platformFee = (this.platformFeePercentage / 100) * amount;
    const gameDevAmount = amount - platformFee;

    const donation = await this.prisma.donation.create({
      data: {
        amount,
        description,
        payerEmail,
        gameId,
        userId,
        token: donationId,
        platformFee,
        gameDevAmount,
      },
    });

    const body = {
      items: [
        {
          id: donation.id.toString(),
          title: 'Doação',
          description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: amount,
        },
      ],
      back_urls: {
        success: 'http://localhost:3000/success',
        failure: 'http://localhost:3000/failure',
        pending: 'http://localhost:3000/pending',
      },
      auto_return: 'all',
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
      },
    };

    try {
      const response = await this.preference.create({ body });
      return {
        preferenceId: response.id,
        token: donation.token,
      };
    } catch (error) {
      throw error;
    }
  }

  async validateDonationToken(token: string) {
    const donation = await this.prisma.donation.findUnique({
      where: { token },
    });

    if (!donation) {
      return null;
    }

    return {
      gameId: donation.gameId,
      userId: donation.userId,
      benefits: await this.getEscalatedBenefits(donation.amount),
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

    const gamesByAuthor = await this.prisma.game.findMany({
      where: { userId: authorId },
      select: { id: true },
    });

    const gameIds = gamesByAuthor.map((g) => g.id);

    const result = await this.prisma.donation.aggregate({
      where: {
        gameId: { in: gameIds },
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

  async validateGameDevCode(gameId: number, token: string) {
    const donation = await this.prisma.donation.findFirst({
      where: { gameId, token },
    });

    if (!donation) {
      return { valid: false, message: 'Código inválido ou não associado a este jogo.' };
    }

    return {
      valid: true,
      message: 'Código válido.',
      amount: donation.amount,
      benefits: await this.getEscalatedBenefits(donation.amount),
    };
  }
}
