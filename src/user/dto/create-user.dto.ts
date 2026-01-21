import { IsBoolean, IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {

@IsString()
@MinLength(3)
@IsNotEmpty()
fullName: string;

@IsEmail()
@IsNotEmpty()
email: string;

@IsNotEmpty()
@IsString()
@MinLength(6)
password: string;


hashedRefreshToken?: string;
}
