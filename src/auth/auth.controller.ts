import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/database/user/user.schema';
import { Response } from 'express';

interface loginTypes {
  login: string;
  password: string;
}

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async createUser(@Body() user: User): Promise<User> {
    return await this.authService.create(user);
  }

  @Post('login')
  async loginUser(@Body() user: loginTypes) {
    const result = await this.authService.login(user);
    return result;
  }

  @Post('verify')
  async verify(@Res() res: Response, @Body() body: { token: string }) {
    const result = await this.authService.verify(body.token);
    if (result.status === 'Token incorrect') {
      return res.status(403).send(result);
    }
    return res.status(200).send(result);
  }
}
