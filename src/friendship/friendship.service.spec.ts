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

  describe('followUser', () => {
    it('deve permitir que um usuário siga outro', async () => {
      const followerId = 1;
      const followingId = 2;
      const expectedFriendship = { id: 1, senderId: followerId, receiverId: followingId, status: 'following', createdAt: new Date() };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: followerId } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: followingId } as any);
      jest.spyOn(prisma.friendship, 'create').mockResolvedValueOnce(expectedFriendship);

      const result = await service.followUser(followerId, followingId);

      expect(result).toEqual(expectedFriendship);
      expect(prisma.friendship.create).toHaveBeenCalledWith({
        data: {
          senderId: followerId,
          receiverId: followingId,
          status: 'following',
        },
      });
    });

    it('deve lançar NotFoundException se o usuário seguidor não existir', async () => {
      const followerId = 1;
      const followingId = 2;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se o usuário a ser seguido não existir', async () => {
      const followerId = 1;
      const followingId = 2;

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({ id: followerId } as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(service.followUser(followerId, followingId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listFollowing', () => {
    it('deve retornar a lista de usuários que o usuário está seguindo', async () => {
      const userId = 1;
      const expectedFollowings = [
        { id: 1, senderId: userId, receiverId: 2, status: 'following', createdAt: new Date() },
      ];

      jest.spyOn(prisma.friendship, 'findMany').mockResolvedValueOnce(expectedFollowings);

      const result = await service.listFollowing(userId);

      expect(result).toEqual(expectedFollowings);
      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: { senderId: userId, status: 'following' },
        include: { receiver: true },
      });
    });
  });

  describe('listFollowers', () => {
    it('deve retornar a lista de usuários que estão seguindo o usuário', async () => {
      const userId = 1;
      const expectedFollowers = [
        { id: 1, senderId: 2, receiverId: userId, status: 'following', createdAt: new Date() },
      ];

      jest.spyOn(prisma.friendship, 'findMany').mockResolvedValueOnce(expectedFollowers);

      const result = await service.listFollowers(userId);

      expect(result).toEqual(expectedFollowers);
      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: { receiverId: userId, status: 'following' },
        include: { sender: true },
      });
    });
  });


  describe('listFollowers', () => {
    it('deve retornar a lista de usuários que estão seguindo o usuário', async () => {
      const userId = 1;
      const expectedFollowers = [
        { id: 1, senderId: 2, receiverId: userId, status: 'following', createdAt: new Date() },
      ];

      jest.spyOn(prisma.friendship, 'findMany').mockResolvedValueOnce(expectedFollowers);

      const result = await service.listFollowers(userId);

      expect(result).toEqual(expectedFollowers);
      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: { receiverId: userId, status: 'following' },
        include: { sender: true },
      });
    });
  });

  describe('isFollowing', () => {
    it('deve retornar true se o usuário estiver seguindo outro', async () => {
      const followerId = 1;
      const followingId = 2;
      const expectedFriendship = { id: 1, senderId: followerId, receiverId: followingId, status: 'following', createdAt: new Date() };

      jest.spyOn(prisma.friendship, 'findFirst').mockResolvedValueOnce(expectedFriendship);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(true);
      expect(prisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          senderId: followerId,
          receiverId: followingId,
          status: 'following',
        },
      });
    });

    it('deve retornar false se o usuário não estiver seguindo outro', async () => {
      const followerId = 1;
      const followingId = 2;

      jest.spyOn(prisma.friendship, 'findFirst').mockResolvedValueOnce(null);

      const result = await service.isFollowing(followerId, followingId);

      expect(result).toBe(false);
    });
  });
});
