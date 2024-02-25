import { ChainMap, ExplorerFamily } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { ChainConfig } from "../features/chains/chainConfig";
const isDevMode = process?.env?.NODE_ENV === 'development';
const version = process?.env?.NEXT_PUBLIC_VERSION ?? null;
const explorerApiKeys = JSON.parse(process?.env?.EXPLORER_API_KEYS || '{}');

interface Config {
  debug: boolean;
  version: string | null;
  apiUrl: string;
  explorerApiKeys: Record<string, string>;
}

export const config: Config = Object.freeze({
  debug: isDevMode,
  version,
  apiUrl: 'https://explorer4.hasura.app/v1/graphql',
  explorerApiKeys,
});


export const chains : ChainMap<ChainConfig> = {
  'karak' : {
    name : "karak",
    chainId : 2410,
    protocol : ProtocolType.Ethereum,
    domainId : 2410,
    nativeToken : {
      symbol : "ETH",
      name : "Ether",
      decimals: 18
    },
    blockExplorers : [{
      url: "https://explorer.karak.network/",
      family: ExplorerFamily.Blockscout,
      apiUrl: "https://explorer.karak.network/api/v2",
      name: "Etherscan"
    }],
    rpcUrls : [{
      http: "https://rpc.karak.network"
    }],
    mailbox: "0xBcE1F98deB90e00e8B4f936060728529DE76Ac94",
    interchainGasPaymaster: "0x3DCc5E0A63433BDc1d143175bb8ce244Dafc9381"
  },
  'optimism' : {
    name : "optimism",
    chainId : 10,
    protocol : ProtocolType.Ethereum,
    domainId : 10,
    nativeToken : {
      symbol : "ETH",
      name : "Ether",
      decimals: 18
    },
    blockExplorers: [
      {
      apiUrl: "https://api-optimistic.etherscan.io/api",
      family: ExplorerFamily.Etherscan,
      name: "Etherscan",
      url: "https://optimistic.etherscan.io"
      }
  ],
    rpcUrls : [{
      http: "https://optimism-mainnet.chainnodes.org/e373c56a-a6e1-4ad8-848b-8a8d6bdc2fc7",
      pagination : {
        maxBlockRange : 20000
      }
    }],
    mailbox: "0xeeCE9CD7Abd1CC84d9dfc7493e7e68079E47eA73",
    interchainGasPaymaster: "0xF04a74899FF4c4410fAF3B5faa29B8Fd199C13DB"
  },
  'arbitrum' : {
    name : "arbitrum",
    chainId : 42161,
    protocol : ProtocolType.Ethereum,
    domainId : 42161,
    nativeToken : {
      symbol : "ETH",
      name : "Ether",
      decimals: 18
    },
    blockExplorers: [
      {
      apiUrl: "https://api.arbiscan.io/api",
      family: ExplorerFamily.Etherscan,
      name: "Arbiscan",
      url: "https://arbiscan.io"
      }
  ],
    rpcUrls : [{
      http: "https://arbitrum-one.chainnodes.org/e373c56a-a6e1-4ad8-848b-8a8d6bdc2fc7",
      pagination : {
        maxBlockRange: 20000
      }
    }],
    mailbox: "0xeeCE9CD7Abd1CC84d9dfc7493e7e68079E47eA73",
    interchainGasPaymaster: "0xF04a74899FF4c4410fAF3B5faa29B8Fd199C13DB"
  }
}