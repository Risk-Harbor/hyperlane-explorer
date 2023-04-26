import { ethers } from 'ethers';

import { ChainMetadata, chainMetadata } from '@hyperlane-xyz/sdk';

import { areAddressesEqual } from '../../utils/addresses';
import { logger } from '../../utils/logger';

import { HyperlaneSmartProvider, ProviderMethod } from './SmartProvider';

jest.setTimeout(30000);

const MIN_BLOCK_NUM = 8000000;
const DEFAULT_ACCOUNT = '0x9d525E28Fe5830eE92d7Aa799c4D21590567B595';
const WETH_CONTRACT = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6';
const WETH_TRANSFER_TOPIC0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TRANSFER_TX_HASH = '0x45a586f90ffd5d0f8e618f0f3703b14c2c9e4611af6231d6fed32c62776b6c1b';

const justExplorersConfig: ChainMetadata = { ...chainMetadata.goerli, publicRpcUrls: [] };
const justRpcsConfig: ChainMetadata = { ...chainMetadata.goerli, blockExplorers: [] };
const combinedConfig: ChainMetadata = { ...chainMetadata.goerli };
const configs: [string, ChainMetadata][] = [
  ['Just Explorers', justExplorersConfig],
  ['Just RPCs', justRpcsConfig],
  ['Combined configs', combinedConfig],
];

describe('SmartProvider', () => {
  let provider: HyperlaneSmartProvider;

  const itDoesIfSupported = (method: ProviderMethod, fn: () => any) => {
    it(method, () => {
      if (provider.supportedMethods.includes(method)) {
        return fn();
      }
    });
  };

  for (const [description, config] of configs) {
    describe(description, () => {
      beforeAll(() => {
        provider = new HyperlaneSmartProvider(config);
      });

      itDoesIfSupported(ProviderMethod.GetBlock, async () => {
        const latestBlock = await provider.getBlock('latest');
        logger.debug('Latest block #', latestBlock.number);
        expect(latestBlock.number).toBeGreaterThan(MIN_BLOCK_NUM);
        expect(latestBlock.timestamp).toBeGreaterThan(Date.now() / 1000 - 60 * 60 * 24);
        const firstBlock = await provider.getBlock(1);
        expect(firstBlock.number).toEqual(1);
      });

      itDoesIfSupported(ProviderMethod.GetBlockNumber, async () => {
        const result = await provider.getBlockNumber();
        logger.debug('Latest block #', result);
        expect(result).toBeGreaterThan(MIN_BLOCK_NUM);
      });

      itDoesIfSupported(ProviderMethod.GetGasPrice, async () => {
        const result = await provider.getGasPrice();
        logger.debug('Gas price', result.toString());
        expect(result.toNumber()).toBeGreaterThan(0);
      });

      itDoesIfSupported(ProviderMethod.GetBalance, async () => {
        const result = await provider.getBalance(DEFAULT_ACCOUNT);
        logger.debug('Balance', result.toString());
        expect(parseFloat(ethers.utils.formatEther(result))).toBeGreaterThan(1);
      });

      itDoesIfSupported(ProviderMethod.GetCode, async () => {
        const result = await provider.getCode(WETH_CONTRACT);
        logger.debug('Weth code snippet', result.substring(0, 12));
        expect(result.length).toBeGreaterThan(100);
      });

      itDoesIfSupported(ProviderMethod.GetStorageAt, async () => {
        const result = await provider.getStorageAt(WETH_CONTRACT, 0);
        logger.debug('Weth storage', result);
        expect(result.length).toBeGreaterThan(20);
      });

      itDoesIfSupported(ProviderMethod.GetTransactionCount, async () => {
        const result = await provider.getTransactionCount(DEFAULT_ACCOUNT, 'latest');
        logger.debug('Tx Count', result);
        expect(result).toBeGreaterThan(40);
      });

      itDoesIfSupported(ProviderMethod.GetTransaction, async () => {
        const result = await provider.getTransaction(TRANSFER_TX_HASH);
        logger.debug('Transaction confirmations', result.confirmations);
        expect(result.confirmations).toBeGreaterThan(1000);
      });

      itDoesIfSupported(ProviderMethod.GetTransactionReceipt, async () => {
        const result = await provider.getTransactionReceipt(TRANSFER_TX_HASH);
        logger.debug('Transaction receipt', result.confirmations);
        expect(result.confirmations).toBeGreaterThan(1000);
      });

      itDoesIfSupported(ProviderMethod.GetLogs, async () => {
        const result = await provider.getLogs({
          address: WETH_CONTRACT,
          topics: [WETH_TRANSFER_TOPIC0],
        });
        // console.log(result);
        console.log(JSON.stringify(result.slice(0, 20)));
        logger.debug('Logs found', result.length);
        expect(result.length).toBeGreaterThan(100);
        expect(areAddressesEqual(result[0].address, WETH_CONTRACT)).toBeTruthy();
      });

      itDoesIfSupported(ProviderMethod.EstimateGas, async () => {
        const result = await provider.estimateGas({
          to: DEFAULT_ACCOUNT,
          from: DEFAULT_ACCOUNT,
          value: 1,
        });
        expect(result.toNumber()).toBeGreaterThan(10_000);
      });

      itDoesIfSupported(ProviderMethod.Call, async () => {
        const result = await provider.call({
          to: WETH_CONTRACT,
          from: DEFAULT_ACCOUNT,
          data: '0x70a082310000000000000000000000004f7a67464b5976d7547c860109e4432d50afb38e',
        });
        expect(result).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
      });

      //TODO
      // itDoesIfSupported(ProviderMethod.SendTransaction, async () => {
      //   const result = await provider.sendTransaction('0x1234');
      //   expect(result.hash.length).toBeGreaterThan(10)
      // });
    });
  }
});
