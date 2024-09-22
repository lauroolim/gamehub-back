import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { PrismaService } from '../shared/database/prisma.service';

describe('FriendshipService', () => {
  let service: FriendshipService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FriendshipService, PrismaService],
    }).compile();

    service = module.get<FriendshipService>(FriendshipService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendFriendRequest', () => {
    it('deve enviar uma solicitação de amizade', async () => {
      const senderId = 1;
      const receiverId = 2;
      const expectedFriendship = { id: 1, senderId, receiverId, status: 'pending' };

      (prisma.friendship.create as jest.Mock).mockResolvedValue(expectedFriendship);

      const result = await service.sendFriendRequest(senderId, receiverId);

      expect(result).toEqual(expectedFriendship);
      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: {
          senderId,
          receiverId,
          status: 'pending',
        },
      });
    });
  });

  describe('acceptFriendRequest', () => {
    it('deve aceitar uma solicitação de amizade', async () => {
      const friendshipId = 1;
      const expectedFriendship = { id: friendshipId, status: 'accepted' };

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue(expectedFriendship);
      (prisma.friendship.update as jest.Mock).mockResolvedValue(expectedFriendship);

      const result = await service.acceptFriendRequest(friendshipId);

      expect(result).toEqual(expectedFriendship);
      expect(prisma.friendship.update).toHaveBeenCalledWith({
        where: { id: friendshipId },
        data: { status: 'accepted' },
      });
    });

    it('deve lançar NotFoundException se a solicitação não existir', async () => {
      const friendshipId = 1;

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.acceptFriendRequest(friendshipId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('rejectFriendRequest', () => {
    it('deve recusar uma solicitação de amizade', async () => {
      const friendshipId = 1;
      const expectedFriendship = { id: friendshipId, status: 'rejected' };

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue(expectedFriendship);
      (prisma.friendship.update as jest.Mock).mockResolvedValue(expectedFriendship);

      const result = await service.rejectFriendRequest(friendshipId);

      expect(result).toEqual(expectedFriendship);
      expect(prisma.friendship.update).toHaveBeenCalledWith({
        where: { id: friendshipId },
        data: { status: 'rejected' },
      });
    });

    it('deve lançar NotFoundException se a solicitação não existir', async () => {
      const friendshipId = 1;

      (prisma.friendship.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.rejectFriendRequest(friendshipId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listFriends', () => {
    it('deve retornar a lista de amigos', async () => {
      const userId = 1;
      const expectedFriends = [
        { id: 1, senderId: 1, receiverId: 2, status: 'accepted' },
        { id: 2, senderId: 2, receiverId: 1, status: 'accepted' },
      ];

      (prisma.friendship.findMany as jest.Mock).mockResolvedValue(expectedFriends);

      const result = await service.listFriends(userId);

      expect(result).toEqual(expectedFriends);
      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { senderId: userId, status: 'accepted' },
            { receiverId: userId, status: 'accepted' },
          ],
        },
        include: {
          sender: true,
          receiver: true,
        },
      });
    });
  });
});
