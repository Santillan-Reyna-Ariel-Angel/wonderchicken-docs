import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin',
    description: 'Usuario de bootstrap (SUPER_ADMIN) creado por el seeder',
  })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
