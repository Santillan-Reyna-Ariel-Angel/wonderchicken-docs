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

    // Regla multi-sucursal (PDR §2.7): todo rol distinto de SUPER_ADMIN
    // está restringido a su sucursal → branchId obligatorio. SUPER_ADMIN es
    // global y su acceso lo da el rol (RolesGuard), no branchId.
    if (
      createUserDto.role !== UserRole.SUPER_ADMIN &&
      !createUserDto.branchId
    ) {
      throw new BadRequestException(
        'El branchId es obligatorio para los roles de sucursal',
      );
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
      select: { id: true, role: true, branchId: true },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Regla multi-sucursal (PDR §2.7) sobre el estado FINAL del usuario:
    // si el rol resultante no es SUPER_ADMIN, branchId es obligatorio y no
    // se puede dejar nulo ni remover mediante un update parcial.
    const resultRole = updateUserDto.role ?? existing.role;
    const setRoleToAdmin =
      resultRole !== UserRole.SUPER_ADMIN &&
      (updateUserDto.branchId === undefined
        ? existing.branchId == null
        : updateUserDto.branchId === null);

    if (setRoleToAdmin) {
      throw new BadRequestException(
        'El branchId es obligatorio para los roles de sucursal',
      );
    }

    // Si viene branchId, validar que la sucursal exista (evita FK P2003 → 500).
    if (updateUserDto.branchId !== undefined) {
      const branchExists = await this.prisma.branch.findUnique({
        where: { id: updateUserDto.branchId },
        select: { id: true },
      });
      if (!branchExists) {
        throw new BadRequestException('La sucursal indicada no existe');
      }
    }

    // Update PARCIAL: solo se actualizan los campos presentes en el payload.
    // NOTA: Desestructuramos con type assertion explícito porque la combinación
    // de @MinLength + @IsOptional + strictNullChecks puede romper la inferencia
    // de TypeScript para propiedades string opcionales con decoradores anidados.
    const dto = updateUserDto as {
      name?: string;
      password?: string;
      role?: UserRole;
      active?: boolean;
      branchId?: string;
    };

    const data: {
      name?: string;
      passwordHash?: string;
      role?: UserRole;
      active?: boolean;
      branchId?: string | null;
    } = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.role !== undefined) {
      data.role = dto.role;
    }
    if (dto.active !== undefined) {
      data.active = dto.active;
    }
    if (dto.branchId !== undefined) {
      data.branchId = dto.branchId;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
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
