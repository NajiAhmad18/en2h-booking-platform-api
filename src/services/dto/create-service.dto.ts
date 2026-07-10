/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  IsPositive,
  Max,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'House Cleaning',
    description: 'The title of the service (2-100 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({
    example: 'Comprehensive house cleaning service.',
    description: 'The description of the service (5-1000 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description: string;

  @ApiProperty({
    example: 120,
    description: 'Duration of the service in minutes (max 1440)',
  })
  @IsInt()
  @IsPositive()
  @Max(1440)
  duration: number;

  @ApiProperty({
    example: 2500.5,
    description:
      'Price of the service as a positive decimal (max 2 decimal places)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is publicly active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
