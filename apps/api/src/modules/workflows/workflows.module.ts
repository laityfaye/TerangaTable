import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowEngine } from './workflow.engine';

@Module({
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowEngine],
  exports: [WorkflowsService, WorkflowEngine],
})
export class WorkflowsModule {}
