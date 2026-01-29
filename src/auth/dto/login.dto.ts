import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: 'Email address of the user'  , example: 'JohnDoe@gmail.com'})
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty({description: 'Password for the user account'  ,example: 'StrongP@ssw0rd'})
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;  
}