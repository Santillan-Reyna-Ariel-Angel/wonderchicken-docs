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
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      this.logger.warn(
        `Intento de login con username inexistente: ${loginDto.username}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.active) {
      this.logger.warn(
        `Intento de login con usuario inactivo: ${loginDto.username}`,
      );
      throw new UnauthorizedException('La cuenta está inactiva');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      this.logger.warn(
        `Contraseña incorrecta para usuario: ${loginDto.username}`,
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Login exitoso para usuario: ${user.username}`);

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
