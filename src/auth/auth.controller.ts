import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/database/user/user.schema';
import { Response } from 'express';

interface loginTypes {
  login: string;
  password: string;
}

interface changeData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthday: string;
}

interface changeDelivery {
  id: string;
  region: string;
  city: string;
  street: string;
  house: string;
  index: string;
}

interface changePassword {
  id: string;
  currentPassword: string;
  newPassword: string;
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async createUser(@Body() user: User): Promise<User | Object> {
    return await this.authService.create(user);
  }

  @Post('login')
  async loginUser(@Body() user: loginTypes) {
    const result = await this.authService.login(user);
    return result;
  }

  @Post('verify')
  async verify(@Body() body: { token: string }) {
    const result = await this.authService.verify(body.token);
    if (result.status === 'token incorrect') {
      return result;
    }
    return result;
  }

  @Post('change/data')
  async changeData(@Body() body: changeData) {
    return await this.authService.changeData(body);
  }

  @Post('change/delivery')
  async changeDelivery(@Body() body: changeDelivery) {
    return await this.authService.changeDelivery(body);
  }

  @Post('change/password')
  async changePassword(@Body() body: changePassword) {
    return await this.authService.changePassword(body);
  }
}
