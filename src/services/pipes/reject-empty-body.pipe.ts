/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class RejectEmptyBodyPipe implements PipeTransform {
  transform(value: any) {
    if (
      typeof value !== 'object' ||
      value === null ||
      Object.keys(value).length === 0
    ) {
      throw new BadRequestException('Request body cannot be empty');
    }
    return value;
  }
}
