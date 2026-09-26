import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ActionService } from './action/action.service.js';
import { ActionController } from './action/action.controller.js';

@Module({
  imports: [],
  controllers: [AppController, ActionController],
  providers: [AppService, ActionService],
})
export class AppModule {}
