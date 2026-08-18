import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from '../../generated/prisma/enums.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('El username ya está registrado');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        username: createUserDto.username,
        passwordHash,
        role: createUserDto.role,
        branchId: createUserDto.branchId ?? null,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario creado: ${user.username} (${user.role})`);

    return {
      isSuccess: true,
      message: 'Usuario creado correctamente',
      data: { user },
      error: null,
    };
  }

  async findAll(role?: UserRole) {
    const where = role ? { role } : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          active: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      isSuccess: true,
      message: 'Usuarios obtenidos correctamente',
      data: { users, total },
      error: null,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      isSuccess: true,
      message: 'Usuario obtenido correctamente',
      data: { user },
      error: null,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role: updateUserDto.role,
        active: updateUserDto.active,
        branchId: updateUserDto.branchId,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario actualizado: ${user.username}`);

    return {
      isSuccess: true,
      message: 'Usuario actualizado correctamente',
      data: { user },
      error: null,
    };
  }
}
