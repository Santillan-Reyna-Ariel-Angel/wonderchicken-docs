import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: {
    branch: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      branch: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('create', () => {
    it('debería crear una sucursal correctamente', async () => {
      const createBranchDto: CreateBranchDto = {
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
      };

      const expectedBranch = {
        id: 'uuid-123',
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.branch.create.mockResolvedValue(expectedBranch);

      const result = await service.create(createBranchDto);

      expect(prisma.branch.create).toHaveBeenCalledWith({
        data: {
          name: 'Sucursal Centro',
          address: 'Av. Corrientes 1234, CABA',
          active: true,
        },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        isSuccess: true,
        message: 'Sucursal creada correctamente',
        data: { branch: expectedBranch },
        error: null,
      });
    });
  });

  describe('findAll', () => {
    it('debería listar todas las sucursales', async () => {
      const branches = [
        {
          id: 'uuid-1',
          name: 'Sucursal 1',
          address: 'Dirección 1',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'uuid-2',
          name: 'Sucursal 2',
          address: 'Dirección 2',
          active: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.$transaction.mockResolvedValue([branches, 2]);

      const result = await service.findAll();

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        isSuccess: true,
        message: 'Sucursales obtenidas correctamente',
        data: { branches, total: 2 },
        error: null,
      });
    });
  });

  describe('findOne', () => {
    it('debería encontrar una sucursal por id', async () => {
      const branch = {
        id: 'uuid-123',
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.branch.findUnique.mockResolvedValue(branch);

      const result = await service.findOne('uuid-123');

      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        isSuccess: true,
        message: 'Sucursal obtenida correctamente',
        data: { branch },
        error: null,
      });
    });

    it('debería lanzar NotFoundException si la sucursal no existe', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debería actualizar una sucursal correctamente', async () => {
      const updateBranchDto: UpdateBranchDto = {
        name: 'Sucursal Centro Actualizada',
        address: 'Nueva dirección 456',
      };

      const existingBranch = {
        id: 'uuid-123',
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBranch = {
        ...existingBranch,
        name: 'Sucursal Centro Actualizada',
        address: 'Nueva dirección 456',
      };

      prisma.branch.findUnique.mockResolvedValue(existingBranch);
      prisma.branch.update.mockResolvedValue(updatedBranch);

      const result = await service.update('uuid-123', updateBranchDto);

      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: {
          name: 'Sucursal Centro Actualizada',
          address: 'Nueva dirección 456',
        },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        isSuccess: true,
        message: 'Sucursal actualizada correctamente',
        data: { branch: updatedBranch },
        error: null,
      });
    });

    it('debería lanzar NotFoundException si la sucursal no existe', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(
        service.update('uuid-inexistente', { name: 'Nuevo nombre' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('debería desactivar una sucursal correctamente', async () => {
      const existingBranch = {
        id: 'uuid-123',
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deactivatedBranch = {
        ...existingBranch,
        active: false,
      };

      prisma.branch.findUnique.mockResolvedValue(existingBranch);
      prisma.branch.update.mockResolvedValue(deactivatedBranch);

      const result = await service.deactivate('uuid-123');

      expect(prisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(prisma.branch.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { active: false },
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).toEqual({
        isSuccess: true,
        message: 'Sucursal desactivada correctamente',
        data: { branch: deactivatedBranch },
        error: null,
      });
    });

    it('debería lanzar NotFoundException si la sucursal no existe', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
