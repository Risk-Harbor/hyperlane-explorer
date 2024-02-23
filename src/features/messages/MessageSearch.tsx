import { useState } from 'react';

import { Fade } from '../../components/animations/Fade';
import { Card } from '../../components/layout/Card';
import { SearchBar } from '../../components/search/SearchBar';
import {
  SearchEmptyError,
  SearchFetching,
  SearchInvalidError,
  SearchUnknownError,
} from '../../components/search/SearchStates';
import useDebounce from '../../utils/debounce';
import { useQueryParam, useSyncQueryParam } from '../../utils/queryParams';
import { sanitizeString } from '../../utils/string';

import { MessageTable } from './MessageTable';
import { usePiChainMessageSearchQuery } from './pi-queries/usePiChainMessageQuery';
import { useMessageSearchQuery } from './queries/useMessageQuery';

const QUERY_SEARCH_PARAM = 'search';

export function MessageSearch() {
  // Search text input
  const defaultSearchQuery = useQueryParam(QUERY_SEARCH_PARAM);
  const [searchInput, setSearchInput] = useState(defaultSearchQuery);
  const debouncedSearchInput = useDebounce(searchInput, 750);
  const hasInput = !!debouncedSearchInput;
  const sanitizedInput = sanitizeString(debouncedSearchInput);

  // Filter state
  const [originChainFilter, setOriginChainFilter] = useState<string | null>(null);
  const [destinationChainFilter, setDestinationChainFilter] = useState<string | null>(null);
  const [startTimeFilter, setStartTimeFilter] = useState<number | null>(null);
  const [endTimeFilter, setEndTimeFilter] = useState<number | null>(null);

  // GraphQL query and results
  const { isValidInput, isError, isFetching, hasRun, messageList, isMessagesFound } =
    useMessageSearchQuery(
      sanitizedInput,
      originChainFilter,
      destinationChainFilter,
      startTimeFilter,
      endTimeFilter,
    );

  // Run permissionless interop chains query if needed
  const {
    isError: isPiError,
    isFetching: isPiFetching,
    hasRun: hasPiRun,
    messageList: piMessageList,
    isMessagesFound: isPiMessagesFound,
  } = usePiChainMessageSearchQuery({
    sanitizedInput,
    startTimeFilter,
    endTimeFilter,
    pause: false,
  });

  // Coalesce GraphQL + PI results
  const isAnyFetching =  isPiFetching;
  const isAnyError =  isPiError;
  const hasAllRun =  hasPiRun;
  const isAnyMessageFound =  isPiMessagesFound;
  const messageListResult =  piMessageList;

  // Keep url in sync
  useSyncQueryParam(QUERY_SEARCH_PARAM, '');

  return (
    <>
      <SearchBar
        value={searchInput}
        onChangeValue={setSearchInput}
        isFetching={isAnyFetching}
        placeholder="Search by address, hash, or message id"
      />
      <Card className="relative w-full min-h-[38rem] mt-4" padding="">
        <div className="px-2 pt-3.5 pb-3 sm:px-4 md:px-5 flex items-center justify-between">
          <h2 className="w-min sm:w-fit pl-0.5 text-blue-500 font-medium">
            {!hasInput ? 'Latest Messages' : 'Search Results'}
          </h2>
        </div>
        <Fade show={!isAnyError && isValidInput && isAnyMessageFound}>
          <MessageTable messageList={messageListResult} isFetching={isAnyFetching} />
        </Fade>
        <SearchFetching
          show={!isAnyError && isValidInput && !isAnyMessageFound && !hasAllRun}
          isPiFetching={isPiFetching}
        />
        <SearchEmptyError
          show={!isAnyError && isValidInput && !isAnyMessageFound && hasAllRun}
          hasInput={hasInput}
          allowAddress={true}
        />
        <SearchUnknownError show={isAnyError && isValidInput} />
        <SearchInvalidError show={false} allowAddress={true} />
      </Card>
    </>
  );
}
