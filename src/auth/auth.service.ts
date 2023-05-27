import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/user/user.schema';
import axios from 'axios';
import {
  CheckPhone,
  CheckPhoneDocument,
} from 'src/database/user/check-phone.schema';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CheckPhone.name)
    private checkPhoneModel: Model<CheckPhoneDocument>,
  ) {}

  async create(user: User): Promise<Object | User> {
    function generateRandomDigits() {
      var randomDigits = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      return randomDigits;
    }

    const checkUser = await this.userModel.findOne({ email: user.email });
    console.log(checkUser);

    if (checkUser)
      return {
        code: 409,
        status: 'have such user',
      };

    const createdUser = new this.userModel({
      ...user,
      password: bcrypt.hashSync(user.password),
      birthday: '',
      orderHistory: [],
      delivery: {
        region: '',
        city: '',
        street: '',
        house: '',
        index: '',
      },
      activeAccoung: false,
    });
    const result = await createdUser.save();

    await this.checkPhoneModel.create({
      phone: user.phone,
      code: generateRandomDigits(),
    });

    return {
      code: 201,
      status: 'ok',
      data: result,
    };
  }

  async acceptPhone(data: acceptPhoneData): Promise<Object> {
    const getPhone = await this.checkPhoneModel.findOne({ phone: data.phone });

    if (!getPhone) {
      return {
        code: 404,
        status: 'Not Found',
      };
    }

    if (getPhone.code === data.code) {
      return {
        code: 200,
        status: 'active',
      };
    } else {
      return {
        code: 400,
        status: 'code incorrect',
      };
    }
  }

  async login(user: loginTypes) {
    const checkEmail = await this.userModel.findOne({
      email: user.login,
    });
    const checkPhone = await this.userModel.findOne({
      phone: user.login,
    });
    if (!checkEmail && !checkPhone) return 'Not Found';

    if (checkEmail) {
      if (bcrypt.compareSync(user.password, checkEmail.password)) {
        if (!checkEmail.activeAccoung) {
          return {
            code: 401,
            status: 'not active',
            phone: checkEmail.phone,
          };
        }
        const payload = {
          id: checkEmail._id,
        };
        const token = jwt.sign(payload, process.env.TOKEN_KEY);
        return {
          code: 200,
          status: 'ok',
          token: token,
        };
      } else {
        return {
          code: 401,
          status: 'password Incorrect',
          token: '',
        };
      }
    }
    if (checkPhone) {
      if (bcrypt.compareSync(user.password, checkPhone.password)) {
        if (!checkPhone.activeAccoung) {
          return {
            code: 401,
            status: 'not active',
            phone: checkPhone.phone,
          };
        }

        const payload = {
          id: checkPhone._id,
        };

        const token = jwt.sign(payload, process.env.TOKEN_KEY);
        return {
          code: 200,
          status: 'ok',
          token: token,
        };
      } else {
        return {
          code: 401,
          status: 'password Incorrect',
          token: '',
        };
      }
    }
  }

  async verify(token: string) {
    try {
      const { id } = jwt.verify(token, process.env.TOKEN_KEY);
      const total = await this.userModel.findOne({ _id: id });
      if (total) {
        return {
          code: 200,
          status: 'ok',
          body: total,
        };
      } else {
        return {
          code: 401,
          status: 'token incorrect',
          body: {},
        };
      }
    } catch (err) {
      console.log(err);
      return {
        code: 401,
        status: 'token incorrect',
        body: {},
      };
    }
  }

  async changeData(data: changeData) {
    const currentUser = await this.userModel.findOne({ _id: data.id });
    if (!currentUser) {
      return {
        code: 404,
        status: 'Not Found',
      };
    }

    const result = await this.userModel.findByIdAndUpdate(
      { _id: data.id },
      data,
    );

    return {
      code: 201,
      status: 'ok',
    };
  }

  async changeDelivery(data: changeDelivery) {
    const currentUser = await this.userModel.findOne({ _id: data.id });
    if (!currentUser) {
      return {
        code: 404,
        status: 'Not Found',
      };
    }
    console.log(data);
    await this.userModel.findByIdAndUpdate(
      { _id: data.id },
      { delivery: data },
    );

    return {
      code: 201,
      status: 'ok',
    };
  }

  async changePassword(data: changePassword) {
    const currentUser = await this.userModel.findOne({ _id: data.id });
    if (!currentUser) {
      return {
        code: 404,
        status: 'Not Found',
      };
    }
    if (bcrypt.compareSync(data.currentPassword, currentUser.password)) {
      await this.userModel.findByIdAndUpdate(
        { _id: data.id },
        { password: bcrypt.hashSync(data.newPassword) },
      );
      return {
        code: 201,
        status: 'ok',
      };
    }

    return {
      code: 401,
      status: 'Incorrect password',
    };
  }

  async createOrder(data: orderData) {
    const statusCurrent =
      data.statusOrder === 'В процесі оброблення' ? 'loading' : 'rejected';

    try {
      const getUser = await this.userModel.findById(data.idUser);
      await axios.post(`${process.env.ADMIN_API}/api/orders`, {
        ...data,
        statusOrder: statusCurrent,
      });
      await this.userModel.findByIdAndUpdate(data.idUser, {
        orderHistory: [...getUser.orderHistory, data.id],
      });
      return {
        code: 201,
        status: 'ok',
      };
    } catch (err) {
      console.log(err);

      return {
        code: 400,
        status: 'rejected',
      };
    }
  }
}
