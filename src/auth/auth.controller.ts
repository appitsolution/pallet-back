import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/database/user/user.schema';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

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
  orderHistory: string[];
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

interface orderData {
  id: string; //Ид заказа
  idUser: string; //Ид пользователя
  statusOrder: string; // Статус заказа
  city: string; //Город заказа
  delivery: string; //Способ доставки
  address: string; // Адресс склада
  paymentSelect: string; //Способ оплаты
  dateSend: string; //Дата отправки
  dateCreate: string; //Дата создания заказа
  products: []; //Список товаров
}

interface acceptPhoneData {
  phone: string;
  code: string;
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

  @Post('accept-phone')
  async acceptPhone(@Body() data: acceptPhoneData): Promise<Object> {
    return this.acceptPhone(data);
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

  @Post('create/order')
  async createOrder(@Body() body: orderData) {
    return await this.authService.createOrder(body);
  }
  @Post('photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Обработка загруженного файла
    console.log(file);

    // Вернуть ответ или выполнить необходимую обработку
  }
}
