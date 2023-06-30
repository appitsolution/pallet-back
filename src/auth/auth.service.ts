import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/user/user.schema';
import axios from 'axios';
import {
  CheckPhone,
  CheckPhoneDocument,
} from 'src/database/user/check-phone.schema';
import {
  ResetPasswordDocument,
  ResetPassword,
} from 'src/database/user/reset-password.schema';
import {
  loginTypes,
  changeData,
  changeDelivery,
  changePassword,
  orderData,
  acceptPhoneData,
  BonusHistory,
  BonusNotActive,
} from './auth.types';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const btoa = require('btoa');

// SET HERE YOUR url, clientId, and secret

function authenticate(authUrl: string, username: string, password: string) {
  const encoded = btoa(username + ':' + password);
  const headers = {
    Authorization: 'Basic ' + encoded,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const payload = 'grant_type=client_credentials';

  return axios
    .post(authUrl, payload, { headers })
    .then((response) => response.data.access_token)
    .catch((error) => {
      console.error('Authentication error:', error);
      throw error;
    });
}

function getCurrentDate() {
  let currentDate = new Date();

  let day = String(currentDate.getDate());
  let month = String(currentDate.getMonth() + 1);
  let year = String(currentDate.getFullYear());

  if (Number(day) < 10) {
    day = '0' + day;
  }
  if (Number(month) < 10) {
    month = '0' + month;
  }

  let formattedDate = year + '.' + month + '.' + day;

  return formattedDate;
}

function generateTempPassword(length = 8) {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let tempPassword = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    tempPassword += characters[randomIndex];
  }

  return tempPassword;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CheckPhone.name)
    private checkPhoneModel: Model<CheckPhoneDocument>,
    @InjectModel(ResetPassword.name)
    private resetPasswordModel: Model<ResetPasswordDocument>,
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
      activeAccount: false,
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
      const user = await this.userModel.findOne({ phone: data.phone });
      await this.userModel.findByIdAndUpdate(user._id, { activeAccount: true });
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

  async sendCode(data: { phone: string }): Promise<Object> {
    const currentCode = await this.checkPhoneModel.findOne({
      phone: data.phone,
    });

    const authServerTokenUrl =
      'https://api-gateway.kyivstar.ua/idp/oauth2/token';
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    const token = await authenticate(
      authServerTokenUrl,
      clientId,
      clientSecret,
    );

    const result = await axios.post(
      `https://api-gateway.kyivstar.ua/sandbox/rest/v1beta/sms`,
      {
        from: 'messagedesk',
        to: data.phone,
        text: `Your code ${currentCode.code}`,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );

    if (!currentCode) {
      return {
        code: 404,
        status: 'not found',
      };
    }

    return {
      code: 200,
      status: 'ok',
    };
  }

  async resetPassword(data: { phone: string }): Promise<Object> {
    const currentUser = await this.userModel.findOne({ phone: data.phone });
    if (!currentUser) {
      return {
        code: 404,
        status: 'not found',
      };
    }

    const newPassword = generateTempPassword();

    await this.userModel.findByIdAndUpdate(
      { _id: currentUser.id },
      { password: bcrypt.hashSync(newPassword) },
    );

    const checkResetPassword = await this.resetPasswordModel.findOne({
      phone: currentUser.phone,
    });

    if (!checkResetPassword) {
      await this.resetPasswordModel.create({
        phone: currentUser.phone,
        password: newPassword,
      });
    } else {
      await this.resetPasswordModel.findOneAndUpdate(
        { phone: currentUser.phone },
        {
          phone: currentUser.phone,
          password: newPassword,
        },
      );
    }

    return {
      code: 200,
      status: 'ok',
    };
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
        if (!checkEmail.activeAccount) {
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
        if (!checkPhone.activeAccount) {
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

  async bonusOrder(data: BonusNotActive) {
    const user = await this.userModel.findById(data.idUser);

    const checkBonus = user.bonus.bonusNotActive.find(
      (item) => item.id === data.id,
    );

    if (checkBonus !== undefined)
      return {
        code: 403,
        status: 'error',
      };

    const result = await this.userModel.findByIdAndUpdate(user._id, {
      bonus: {
        bonusScore: user.bonus.bonusScore,
        bonusHistory: user.bonus.bonusHistory,
        bonusNotActive: [...user.bonus.bonusNotActive, data],
      },
    });

    return {
      code: 201,
      status: 'ok',
    };
  }

  async bonusActivated(data: { id: string; idUser: string }) {
    const user = await this.userModel.findById(data.idUser);
    const bonusItem = user.bonus.bonusNotActive.find(
      (item) => item.id === data.id,
    );
    const result = this.userModel.findByIdAndUpdate(data.idUser, {
      bonus: {
        bonusScore: String(
          Number(user.bonus.bonusScore) + Number(bonusItem.order) * 1,
        ),
        bonusHistory: [...user.bonus.bonusHistory, bonusItem],
        bonusNotActive: [
          ...user.bonus.bonusNotActive.filter((item) => item.id !== data.id),
        ],
        startBonusDate:
          user.bonus.bonusScore === '0'
            ? getCurrentDate()
            : user.bonus.startBonusDate,
      },
    });

    return result;
  }

  async checkBonusActive() {
    const result = await this.userModel.find();

    Promise.all([
      result.forEach(async (user) => {
        const currentDate = new Date();
        const dateString = user.bonus.startBonusDate;
        if (dateString === '') return;
        const targetDate = new Date(dateString as string);

        const timeDifference: number =
          currentDate.getTime() - targetDate.getTime();

        const millisecondsInDay: number = 1000 * 60 * 60 * 24;
        const daysDifference: number = Math.ceil(
          timeDifference / millisecondsInDay,
        );

        const yearDifference =
          currentDate.getFullYear() - targetDate.getFullYear();
        const monthDifference: number =
          currentDate.getMonth() - targetDate.getMonth();
        const dayDifference: number =
          currentDate.getDate() - targetDate.getDate();

        const testDate =
          yearDifference > 1 ||
          (yearDifference === 1 &&
            (monthDifference > 0 ||
              (monthDifference === 0 && dayDifference >= 0))) ||
          (yearDifference === 0 &&
            monthDifference === 0 &&
            daysDifference >= 30);

        if (testDate) {
          await this.userModel.findByIdAndUpdate(user._id, {
            bonus: {
              bonusScore: '0',
              bonusHistory: [],
              bonusNotActive: [],
              startBonusDate: '',
            },
          });
          return;
        } else {
          currentDate.setMonth(currentDate.getMonth() + 12);

          const newDate: string = currentDate.toISOString().split('T')[0];

          console.log(newDate);
          return user.bonus.startBonusDate;
        }
      }),
    ]);
    return 'ok';
  }
}
