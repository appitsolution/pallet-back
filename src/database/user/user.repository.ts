import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';

import { User, UserDocument } from './user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOne(userFilter: FilterQuery<User>): Promise<User> {
    return this.userModel.findOne(userFilter);
  }

  async find(userFilter: FilterQuery<User>): Promise<User[]> {
    return this.userModel.find(userFilter);
  }

  async create(userCreate: User): Promise<User> {
    const newUser = new this.userModel(userCreate);
    return newUser.save();
  }
}
