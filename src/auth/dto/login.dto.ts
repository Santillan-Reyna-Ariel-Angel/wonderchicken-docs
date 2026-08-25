import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@wonderchicken.com',
    description: 'Email del usuario para login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0000000', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
