import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { BlockchainModule } from './blockchain/blockchain.module';
import { GasModule } from './gas/gas.module';
import { UniswapModule } from './uniswap/uniswap.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BlockchainModule,
    GasModule,
    UniswapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
