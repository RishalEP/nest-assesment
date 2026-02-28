import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class ProviderService {
  public readonly provider: ethers.providers.JsonRpcProvider;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('ETH_RPC_URL');
    if (!rpcUrl) throw new Error('Missing ETH_RPC_URL in .env');

    const chainId = Number(this.configService.get<string>('CHAIN_ID') ?? '1');

    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId);
  }
}
