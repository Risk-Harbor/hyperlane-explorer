import { useQuery } from '@tanstack/react-query';

import { MultiProvider } from '@hyperlane-xyz/sdk';
import { ensure0x } from '@hyperlane-xyz/utils';

import { Message } from '../../../types';
import { logger } from '../../../utils/logger';
import { ChainConfig } from '../../chains/chainConfig';
import { useChainConfigs } from '../../chains/useChainConfigs';
import { useMultiProvider } from '../../providers/multiProvider';
import { isValidSearchQuery } from '../queries/useMessageQuery';

import { fetchBlockNumberByTimestamp } from '../../../utils/blockCalculator';
import { PiMessageQuery, PiQueryType, fetchMessagesFromPiChain } from './fetchPiChainMessages';

// Query 'Permissionless Interoperability (PI)' chains using custom
// chain configs in store state
export function usePiChainMessageSearchQuery({
  sanitizedInput,
  startTimeFilter,
  endTimeFilter,
  pause,
}: {
  sanitizedInput: string;
  startTimeFilter: number | null;
  endTimeFilter: number | null;
  pause: boolean;
}) {
  const chainConfigs = useChainConfigs();
  const multiProvider = useMultiProvider();
  const { isLoading, isError, data } = useQuery(
    [
      'usePiChainMessageSearchQuery',
      chainConfigs,
      sanitizedInput,
      startTimeFilter,
      endTimeFilter,
      pause,
    ],
    async () => {
      const hasInput = !!sanitizedInput;
      const isValidInput = isValidSearchQuery(sanitizedInput, true);
      if (pause || !hasInput || !isValidInput || !Object.keys(chainConfigs).length) return [];
      logger.debug('Starting PI Chain message search for:', sanitizedInput);
      // TODO convert timestamps to from/to blocks here
      const query = { input: ensure0x(sanitizedInput) };
      try {
        const messagePromises = await Promise.all(
          Object.values(chainConfigs).map((c) => fetchMessagesOrThrow(c, query, multiProvider))
        );
        //Filter rejected promises.
        const filterdMsgs = (messagePromises.filter(value => (value.length !== 0))).flat();
        return filterdMsgs;
      } catch (e) {
        logger.error('Error fetching PI messages for:', sanitizedInput, e);
        return [];
      }
    },
    { retry: false },
  );

  return {
    isFetching: isLoading,
    isError,
    hasRun: !!data,
    messageList: data || [],
    isMessagesFound: !!data?.length,
  };
}

export function usePiChainMessageQuery({
  messageId,
  pause,
  messageData
}: {
  messageId: string;
  pause: boolean;
  messageData: Message | undefined
}) {
  const chainConfigs = useChainConfigs();
  const multiProvider = useMultiProvider();
  const { isLoading, isError, data } = useQuery(
    ['usePiChainMessageQuery', chainConfigs, messageId, pause, messageData],
    async () => {
      if (pause || !messageId || !Object.keys(chainConfigs).length || messageData == undefined) return [];
      logger.info('Starting PI Chain message query for:', messageId);
      const originProvider = multiProvider.getProvider(messageData.originChainId);
      const destinationProvider = multiProvider.getProvider(messageData.destinationChainId);
      const timestamp = (await originProvider?.getBlock(messageData.origin.blockNumber)).timestamp;
      const query = { input: ensure0x(messageId),  fromBlock : (await fetchBlockNumberByTimestamp(destinationProvider, timestamp, messageData.destinationChainId))};
      try {
        const messagePromises = await Promise.all(
          Object.values(chainConfigs).map((c) => fetchMessagesOrThrow(c, query, multiProvider))
        );
        //Filter rejected promises.
        const filterdMsgs = (messagePromises.filter(value => (value.length !== 0))).flat();
        return filterdMsgs;
      } catch (e) {
        logger.error('Error fetching PI messages for:', e);
        return [];
      }
    },
    { retry: false },
    );
    
  const message = data?.length ? data[0] : null;
  const isMessageFound = !!message;

  return {
    isFetching: isLoading,
    isError,
    hasRun: !!data,
    message,
    isMessageFound,
  };
}

async function fetchMessagesOrThrow(
  chainConfig: ChainConfig,
  query: PiMessageQuery,
  multiProvider: MultiProvider,
  queryType?: PiQueryType,
): Promise<Message[]> {
  const messages = await fetchMessagesFromPiChain(chainConfig, query, multiProvider, queryType);
  return messages;
}
