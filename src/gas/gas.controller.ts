import { Controller, Get } from '@nestjs/common';
import { GasService } from './gas.service';
import { ethers } from 'ethers';

@Controller()
export class GasController {
  constructor(private readonly gasService: GasService) {}

  @Get('gasPrice')
  gasPrice() {
    const snapshot = this.gasService.getCachedGasPrice();

    return {
      gasPriceWei: snapshot.gasPriceWei,
      gasPriceGwei: ethers.utils.formatUnits(snapshot.gasPriceWei, 'gwei'),
      updatedAt: snapshot.updatedAt,
    };
  }
}
