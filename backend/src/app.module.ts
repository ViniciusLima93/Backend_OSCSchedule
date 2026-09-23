import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActionService } from './action/action.service';
import { ActionController } from './action/action.controller';

@Module({
  imports: [],
  controllers: [AppController, ActionController],
  providers: [AppService, ActionService],
})
export class AppModule {}
