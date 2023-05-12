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

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(user: User): Promise<User> {
    const createdUser = new this.userModel({
      ...user,
      password: bcrypt.hashSync(user.password),
    });
    return createdUser.save();
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
        return token;
      } else {
        return 'Password Incorrect';
      }
    }
    if (checkPhone) {
      if (bcrypt.compareSync(user.password, checkPhone.password)) {
        const payload = {
          id: checkPhone._id,
        };

        const token = jwt.sign(payload, process.env.TOKEN_KEY);
        return token;
      } else {
        return 'Password Incorrect';
      }
    }
  }

  async verify(token: string) {
    try {
      const { id } = jwt.verify(token, process.env.TOKEN_KEY);
      const total = await this.userModel.findOne({ _id: id });
      if (total) {
        return {
          status: 'Accept',
          body: total,
        };
      } else {
        return {
          status: 'Token incorrect',
          body: {},
        };
      }
    } catch (err) {
      console.log(err);
      return {
        status: 'Token incorrect',
        body: {},
      };
    }
  }
}
