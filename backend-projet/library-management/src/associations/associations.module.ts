import { Module } from '@nestjs/common';
import { AssociationsController } from './associations.controller.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [AssociationsController],
})
export class AssociationsModule {}
