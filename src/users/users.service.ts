import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserRole } from '../../generated/prisma/enums.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';

// Roles sobre los que un ADMIN puede hacer toggle-active.
// SUPER_ADMIN puede togglear a cualquiera (incluido él mismo).
// Los ADMINs y SUPER_ADMINs quedan fuera del alcance del ADMIN regular.
const ADMIN_TOGGLE_ALLOWED_ROLES: ReadonlyArray<UserRole> = [
  UserRole.CASHIER,
  UserRole.DISPATCHER,
  UserRole.COOK,
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
      select: { id: true },
    });

    if (existingEmail) {
      throw new BadRequestException('El email ya está registrado');
    }

    const existingCi = await this.prisma.user.findUnique({
      where: { ci: createUserDto.ci },
      select: { id: true },
    });

    if (existingCi) {
      throw new BadRequestException('El CI ya está registrado');
    }

    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: createUserDto.phone },
        select: { id: true },
      });

      if (existingPhone) {
        throw new BadRequestException('El teléfono ya está registrado');
      }
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

    const passwordHash = await bcrypt.hash(createUserDto.ci, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        phone: createUserDto.phone ?? null,
        ci: createUserDto.ci,
        passwordHash,
        role: createUserDto.role,
        branchId: createUserDto.branchId ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ci: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario creado: ${user.email} (${user.role})`);

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
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          ci: true,
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
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ci: true,
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
      select: { id: true, role: true, branchId: true, email: true, ci: true, phone: true },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar unicidad de email si se está actualizando
    if (updateUserDto.email && updateUserDto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
        select: { id: true },
      });
      if (emailExists) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    // Validar unicidad de CI si se está actualizando
    if (updateUserDto.ci && updateUserDto.ci !== existing.ci) {
      const ciExists = await this.prisma.user.findUnique({
        where: { ci: updateUserDto.ci },
        select: { id: true },
      });
      if (ciExists) {
        throw new BadRequestException('El CI ya está registrado');
      }
    }

    // Validar unicidad de phone si se está actualizando
    if (updateUserDto.phone !== undefined && updateUserDto.phone !== existing.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: { phone: updateUserDto.phone },
        select: { id: true },
      });
      if (phoneExists) {
        throw new BadRequestException('El teléfono ya está registrado');
      }
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

    // Defensa en profundidad: el DTO UpdateUserDto NO expone `active`
    // (el toggle tiene endpoint propio). Si alguien intenta colarlo por
    // bypass del DTO, lo rechazamos acá con 400.
    const dto = updateUserDto as Record<string, unknown>;
    if ('active' in dto && dto.active !== undefined) {
      throw new BadRequestException(
        'El campo active no puede modificarse en este endpoint. Use PATCH /users/:id/toggle-active',
      );
    }

    const dtoTyped = updateUserDto as {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      ci?: string;
      role?: UserRole;
      branchId?: string;
    };

    const data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      passwordHash?: string;
      role?: UserRole;
      branchId?: string | null;
    } = {};

    if (dtoTyped.firstName !== undefined) {
      data.firstName = dtoTyped.firstName;
    }
    if (dtoTyped.lastName !== undefined) {
      data.lastName = dtoTyped.lastName;
    }
    if (dtoTyped.email !== undefined) {
      data.email = dtoTyped.email;
    }
    if (dtoTyped.phone !== undefined) {
      data.phone = dtoTyped.phone;
    }
    if (dtoTyped.ci !== undefined) {
      data.passwordHash = await bcrypt.hash(dtoTyped.ci, 10);
    }
    if (dtoTyped.role !== undefined) {
      data.role = dtoTyped.role;
    }
    if (dtoTyped.branchId !== undefined) {
      data.branchId = dtoTyped.branchId;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ci: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Usuario actualizado: ${user.email}`);

    return {
      isSuccess: true,
      message: 'Usuario actualizado correctamente',
      data: { user },
      error: null,
    };
  }

  async toggleActive(id: string, actor: JwtPayload) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, active: true, email: true, role: true },
    });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Regla de autorización por alcance (PDR §2.7):
    //   - SUPER_ADMIN: puede toggle sobre cualquier rol.
    //   - ADMIN: solo sobre CASHIER | DISPATCHER | COOK (no sobre otro ADMIN ni sobre SUPER_ADMIN).
    //   - Cualquier otro rol: 403 (aunque el @Roles del controller ya filtra a nivel HTTP,
    //     duplicamos la defensa acá para mantener el service autoritativo).
    if (
      actor.role === UserRole.ADMIN &&
      !ADMIN_TOGGLE_ALLOWED_ROLES.includes(existing.role)
    ) {
      throw new ForbiddenException(
        'No tiene permisos para cambiar el estado de un usuario con ese rol',
      );
    }

    if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tiene permisos para esta operación');
    }

    // Anti-auto-toggle: un admin no puede desactivarse a sí mismo. Si lo hace,
    // queda fuera del sistema sin posibilidad de re-login. Solo SUPER_ADMIN
    // puede desactivarse a sí mismo (es la cuenta de bootstrap).
    if (existing.id === actor.sub && actor.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'No puede cambiar el estado de su propio usuario',
      );
    }

    const active = !existing.active;

    const user = await this.prisma.user.update({
      where: { id },
      data: { active },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        ci: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `Usuario ${user.active ? 'activado' : 'desactivado'}: ${user.email} (${user.id})`,
    );

    return {
      isSuccess: true,
      message: user.active
        ? 'Usuario activado correctamente'
        : 'Usuario desactivado correctamente',
      data: { user },
      error: null,
    };
  }
}
