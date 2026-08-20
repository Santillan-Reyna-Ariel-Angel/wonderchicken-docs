import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BranchesController } from './branches.controller.js';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

describe('BranchesController', () => {
  let controller: BranchesController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchesController],
      providers: [{ provide: BranchesService, useValue: service }],
    }).compile();

    controller = module.get<BranchesController>(BranchesController);
  });

  describe('create', () => {
    it('debería crear una sucursal', async () => {
      const createBranchDto: CreateBranchDto = {
        name: 'Sucursal Centro',
        address: 'Av. Corrientes 1234, CABA',
      };

      const expectedResult = {
        isSuccess: true,
        message: 'Sucursal creada correctamente',
        data: {
          branch: {
            id: 'uuid-123',
            name: 'Sucursal Centro',
            address: 'Av. Corrientes 1234, CABA',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        error: null,
      };

      service.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createBranchDto);

      expect(service.create).toHaveBeenCalledWith(createBranchDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('debería listar todas las sucursales', async () => {
      const expectedResult = {
        isSuccess: true,
        message: 'Sucursales obtenidas correctamente',
        data: {
          branches: [
            {
              id: 'uuid-1',
              name: 'Sucursal 1',
              address: 'Dirección 1',
              active: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          total: 1,
        },
        error: null,
      };

      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('debería actualizar una sucursal', async () => {
      const updateBranchDto: UpdateBranchDto = {
        name: 'Sucursal Actualizada',
      };

      const expectedResult = {
        isSuccess: true,
        message: 'Sucursal actualizada correctamente',
        data: {
          branch: {
            id: 'uuid-123',
            name: 'Sucursal Actualizada',
            address: 'Av. Corrientes 1234, CABA',
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        error: null,
      };

      service.update.mockResolvedValue(expectedResult);

      const result = await controller.update('uuid-123', updateBranchDto);

      expect(service.update).toHaveBeenCalledWith('uuid-123', updateBranchDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deactivate', () => {
    it('debería desactivar una sucursal', async () => {
      const expectedResult = {
        isSuccess: true,
        message: 'Sucursal desactivada correctamente',
        data: {
          branch: {
            id: 'uuid-123',
            name: 'Sucursal Centro',
            address: 'Av. Corrientes 1234, CABA',
            active: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        error: null,
      };

      service.deactivate.mockResolvedValue(expectedResult);

      const result = await controller.deactivate('uuid-123');

      expect(service.deactivate).toHaveBeenCalledWith('uuid-123');
      expect(result).toEqual(expectedResult);
    });
  });
});
