import { Provider } from "@ethersproject/abstract-provider";
import { MAILBOX_METADTA } from "../consts/environments";

export async function fetchBlockNumberByTimestamp(provider:Provider, reqTimestamp: number, chainId : number) {
  const startBlock = MAILBOX_METADTA[chainId].blockNumber;
  const startTimestamp = (await provider.getBlock(startBlock)).timestamp;
  const latestBlocknumber = await provider.getBlockNumber();
  const latestBlockTimestamp = (await provider.getBlock(latestBlocknumber)).timestamp;
  return Math.floor( startBlock + ((latestBlocknumber - startBlock) * (reqTimestamp - startTimestamp))/ (latestBlockTimestamp - startTimestamp));
}