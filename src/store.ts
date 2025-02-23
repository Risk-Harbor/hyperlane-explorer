import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ChainMap, MultiProvider } from '@hyperlane-xyz/sdk';

import { objMerge } from '@hyperlane-xyz/utils';
import { chains } from './consts/config';
import { ChainConfig } from './features/chains/chainConfig';
import { buildSmartProvider } from './features/providers/SmartMultiProvider';
import { logger } from './utils/logger';

// Increment this when persist state has breaking changes
const PERSIST_STATE_VERSION = 1;

// Keeping everything here for now as state is simple
// Will refactor into slices as necessary
interface AppState {
  chainConfigs: ChainMap<ChainConfig>;
  setChainConfigs: (configs: ChainMap<ChainConfig>) => void;
  multiProvider: MultiProvider;
  setMultiProvider: (mp: MultiProvider) => void;
  bannerClassName: string;
  setBanner: (className: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      chainConfigs: chains,
      setChainConfigs: (configs: ChainMap<ChainConfig>) => {
        const mergedObj = objMerge(configs, chains) as ChainMap<ChainConfig>;
        set({ chainConfigs: mergedObj, multiProvider: buildSmartProvider(configs) });
      },
      multiProvider: buildSmartProvider(chains),
      setMultiProvider: (mp: MultiProvider) => {
        set({ multiProvider: mp });
      },
      bannerClassName: '',
      setBanner: (className: string) => set({ bannerClassName: className }),
    }),
    {
      name: 'hyperlane', // name in storage
      version: PERSIST_STATE_VERSION,
      partialize: (state) => ({ chainConfigs: state.chainConfigs }), // fields to persist
      onRehydrateStorage: () => {
        logger.debug('Rehydrating state');
        return (state, error) => {
          if (error || !state) {
            logger.error('Error during hydration', error);
            return;
          }
          state.setMultiProvider(buildSmartProvider(state.chainConfigs));
          logger.debug('Hydration finished');
        };
      },
    },
  ),
);
