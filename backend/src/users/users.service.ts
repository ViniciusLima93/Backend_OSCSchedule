import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { db } from 'src/prisma/db';

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto) {
    return await db.orm.public.User.create({
      name: createUserDto.name,
      email:createUserDto.email,
      password: createUserDto.password,
      role:createUserDto.role
    });
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
