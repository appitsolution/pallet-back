import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/user/user.schema';
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

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(user: User): Promise<Object | User> {
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
      delivery: {
        region: '',
        city: '',
        street: '',
        house: '',
        index: '',
      },
    });
    const result = await createdUser.save();

    return {
      code: 201,
      status: 'ok',
      data: result,
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
}
