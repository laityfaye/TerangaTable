import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { PermissionGuard } from '../../common/guards/permission.guard';

@Module({
  controllers: [UsersController, InvitationsController],
  providers: [UsersService, InvitationsService, PermissionGuard],
  exports: [UsersService],
})
export class UsersModule {}
