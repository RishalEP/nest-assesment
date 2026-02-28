import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderService } from 'src/blockchain/provider/provider.service';
import { BigNumber } from 'ethers';

type GasSnapshot = {
  gasPriceWei: string;
  updatedAt: number;
};

@Injectable()
export class GasService implements OnModuleInit {
  private snapshot: GasSnapshot | null = null;
  private timer?: NodeJS.Timeout;

  constructor(private readonly providerService: ProviderService) {}

  async onModuleInit() {
    // warm up once
    await this.refresh();

    // refresh every 1s
    this.timer = setInterval(() => {
      void this.refresh();
    }, 1000);

    this.timer.unref?.();
  }

  getCachedGasPrice(): GasSnapshot {
    if (!this.snapshot) {
      return { gasPriceWei: '0', updatedAt: Date.now() };
    }
    return this.snapshot;
  }

  private async refresh(): Promise<void> {
    const gasPrice: BigNumber =
      await this.providerService.provider.getGasPrice();
    this.snapshot = {
      gasPriceWei: gasPrice.toString(),
      updatedAt: Date.now(),
    };
  }
}
