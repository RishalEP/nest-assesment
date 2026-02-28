import { Module } from '@nestjs/common';
import { GasController } from './gas.controller';
import { GasService } from './gas.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [GasController],
  providers: [GasService],
})
export class GasModule {}
