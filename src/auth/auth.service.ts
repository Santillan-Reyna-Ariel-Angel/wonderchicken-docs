import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Buscar solo por email
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
        active: true,
      },
    });

    if (!user) {
      this.logger.warn(
        `Intento de login con email inexistente: ${loginDto.email}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // La contraseña es el CI hasheado
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Contraseña incorrecta para usuario con email: ${loginDto.email}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Login exitoso para usuario con email: ${loginDto.email}`);

    return {
      isSuccess: true,
      message: 'Login exitoso',
      data: { accessToken },
      error: null,
    };
  }

  logout(userId: string) {
    this.logger.log(`Logout para usuario ID: ${userId}`);
    return {
      isSuccess: true,
      message: 'Logout exitoso',
      data: null,
      error: null,
    };
  }
}
