import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderService } from 'src/blockchain/provider/provider.service';
import { BigNumber } from 'ethers';
import { ConfigService } from '@nestjs/config';

type GasSnapshot = {
  gasPriceWei: string;
  updatedAt: number;
};

@Injectable()
export class GasService implements OnModuleInit {
  private snapshot: GasSnapshot | null = null;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly providerService: ProviderService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // warm up once
    await this.refresh();

    const interval =
      Number(this.configService.get('GAS_REFRESH_INTERVAL_MS')) || 3000;

    // refresh every 1s
    this.timer = setInterval(() => {
      void this.refresh();
    }, interval);

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
