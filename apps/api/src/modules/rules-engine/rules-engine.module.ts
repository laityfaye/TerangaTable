import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RulesController } from './rules.controller';
import { RulesService } from './rules.service';
import { RulesEvaluator } from './rules.evaluator';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RulesController],
  providers: [RulesService, RulesEvaluator],
  exports: [RulesEvaluator],
})
export class RulesEngineModule {}
