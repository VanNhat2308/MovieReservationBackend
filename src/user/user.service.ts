import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, QueryUserDto, UpdateUserDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { Prisma, RoleName, User } from 'src/generated/prisma/client';
@Injectable()
export class UserService {
  constructor(private readonly PrismaService: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { fullName, email, password } = createUserDto;
    const existingUser = await this.PrismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    const hashedPassword = await argon.hash(password);

    return this.PrismaService.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role: {
          connect: { name: RoleName.USER },
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: true,
        createdAt: true,
      },
    });
  }

  

async findAll(query: QueryUserDto): Promise<{
  data: any[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}> {
  const {
    page = 1,
    limit = 10,
    role,
    isActive,
    search,
  } = query

  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = {
    ...(role && {
      role: { name: role },
    }),

    ...(isActive && {
      isActive: isActive === 'true',
    }),

    ...(search && {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [data, total] = await this.PrismaService.$transaction([
    this.PrismaService.user.findMany({
      where,
      
      skip,
      take: limit,
      
      include: {
        role: true,
      },
      omit:{ password: true },
      orderBy: {
        createdAt: 'desc',
      },
     
     
    }),
    this.PrismaService.user.count({ where }),
  ])


  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}


  async findOne(id: number) {
    const user = await this.PrismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: true,
        createdAt: true,
        hashedRefreshToken: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.PrismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};

    if (updateUserDto.fullName) {
      data.fullName = updateUserDto.fullName;
    }
    if(updateUserDto.hashedRefreshToken){
      data.hashedRefreshToken = updateUserDto.hashedRefreshToken;
    }

    if (updateUserDto.password) {
      data.password = await argon.hash(updateUserDto.password);
    }

    return this.PrismaService.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: true,
        updatedAt: true,
      },
    });
  }
  // Soft delete
  async remove(id: number) {
    const user = await this.PrismaService.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.PrismaService.user.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }
}
