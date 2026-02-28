import { Module } from '@nestjs/common';
import { ProviderService } from './provider/provider.service';

@Module({
  providers: [ProviderService]
})
export class BlockchainModule {}
