import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {

  @ApiProperty({ description: 'Full name of the user' ,example: 'John Doe' })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Email address of the user'  , example: 'JohnDoe@gmail.com'})
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({description: 'Password for the user account'  ,example: 'StrongP@ssw0rd'})
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;


hashedRefreshToken?: string;
}
