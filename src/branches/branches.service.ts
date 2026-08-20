import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    // Validar que no exista otra sucursal con el mismo nombre
    const existing = await this.prisma.branch.findUnique({
      where: { name: createBranchDto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una sucursal con el nombre "${createBranchDto.name}"`,
      );
    }

    const branch = await this.prisma.branch.create({
      data: {
        name: createBranchDto.name,
        address: createBranchDto.address,
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

    this.logger.log(`Sucursal creada: ${branch.name} (${branch.id})`);

    return {
      isSuccess: true,
      message: 'Sucursal creada correctamente',
      data: { branch },
      error: null,
    };
  }

  async findAll() {
    const [branches, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        select: {
          id: true,
          name: true,
          address: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.branch.count(),
    ]);

    return {
      isSuccess: true,
      message: 'Sucursales obtenidas correctamente',
      data: { branches, total },
      error: null,
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    return {
      isSuccess: true,
      message: 'Sucursal obtenida correctamente',
      data: { branch },
      error: null,
    };
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    // Validar que al menos un campo fue enviado
    if (
      updateBranchDto.name === undefined &&
      updateBranchDto.address === undefined
    ) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar (name o address)',
      );
    }

    // Verificar que la sucursal existe
    await this.findOne(id);

    const branch = await this.prisma.branch.update({
      where: { id },
      data: {
        name: updateBranchDto.name,
        address: updateBranchDto.address,
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

    this.logger.log(`Sucursal actualizada: ${branch.name} (${branch.id})`);

    return {
      isSuccess: true,
      message: 'Sucursal actualizada correctamente',
      data: { branch },
      error: null,
    };
  }

  async deactivate(id: string) {
    const existing = await this.findOne(id);

    if (!existing.data.branch.active) {
      throw new BadRequestException('La sucursal ya se encuentra inactiva');
    }

    const branch = await this.prisma.branch.update({
      where: { id },
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

    this.logger.log(`Sucursal desactivada: ${branch.name} (${branch.id})`);

    return {
      isSuccess: true,
      message: 'Sucursal desactivada correctamente',
      data: { branch },
      error: null,
    };
  }
}
