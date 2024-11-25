import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBenefitDto } from './dto/create-benefit.dto';

@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) { }

  @Post()
  async create(@Body() createDonationDto: CreateDonationDto) {
    return this.donationService.createDonation(createDonationDto);
  }

  @Get('user/:userId/game/:gameId/total-donations')
  async getUserTotalDonations(
    @Param('gameId') gameId: string,
    @Param('userId') userId: string,
  ) {
    const total = await this.donationService.getUserTotalDonations(+gameId, +userId);
    return { totalDonated: total };
  }

  @Get('benefits/:gameId')
  async getBenefits(@Param('gameId') gameId: number) {
    return this.donationService.getBenefits(Number(gameId));
  }

  @Get('game/:gameId/author/total-donations')
  async getTotalDonationsByGameAuthor(@Param('gameId') gameId: string) {
    const total = await this.donationService.getTotalDonationsByGameAuthor(+gameId);
    return { totalDonated: total };
  }

  @Post('benefits')
  async createBenefit(@Body() createBenefitDto: CreateBenefitDto) {
    return this.donationService.setBenefit(createBenefitDto.gameId, createBenefitDto);
  }

  @Get('validate/:token')
  async validateDonationToken(@Param('token') token: string) {
    return this.donationService.validateDonationToken(token);
  }

  @Get('game/:gameId/supporters-count')
  async getGameSupportersCount(@Param('gameId') gameId: string) {
    const count = await this.donationService.getGameSupportersCount(+gameId);
    return { supportersCount: count };
  }
}
