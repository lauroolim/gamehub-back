import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';

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

}
