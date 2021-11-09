import { KeyringAddress } from '@polkadot/ui-keyring/types';
import { Spin } from 'antd';
import { useManualQuery } from 'graphql-hooks';
import { createContext, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TRANSFERS_COUNT_QUERY, CROWDLOANS_COUNT_QUERY } from '../config';
import { useMultisig } from '../hooks';
import { Entry } from '../model';
import { empty } from '../utils';

export const MultisigContext = createContext<{
  inProgress: Entry[];
  multisigAccount: KeyringAddress | null;
  confirmedAccount: number;
  crowdloans: number;
  setMultisigAccount: React.Dispatch<React.SetStateAction<KeyringAddress | null>> | null;
  queryInProgress: () => Promise<void>;
  refreshConfirmedAccount: () => void;
  refreshCrowdloans: () => void;
  setIsPageLock: (lock: boolean) => void;
}>({
  inProgress: [],
  multisigAccount: null,
  setMultisigAccount: null,
  confirmedAccount: 0,
  crowdloans: 0,
  queryInProgress: () => Promise.resolve(),
  setIsPageLock: empty,
  refreshConfirmedAccount: empty,
  refreshCrowdloans: empty,
});

export const EntriesProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const [isPageLocked, setIsPageLock] = useState<boolean>(false);
  const value = useMultisig();
  const { account } = useParams<{ account: string }>();
  const [fetchData, { data }] = useManualQuery<{ transfers: { totalCount: number } }>(TRANSFERS_COUNT_QUERY, {
    variables: { account },
    skipCache: true,
  });
  const refreshConfirmedAccount = useCallback(
    () => fetchData({ variables: { account }, skipCache: true }),
    [account, fetchData]
  );

  const [fetchCrowdloanData, updateData] = useManualQuery<{ crowdloans: { totalCount: number } }>(
    CROWDLOANS_COUNT_QUERY,
    {
      variables: { account },
      skipCache: true,
    }
  );
  const refreshCrowdloans = useCallback(
    () => fetchCrowdloanData({ variables: { account }, skipCache: true }),
    [account, fetchCrowdloanData]
  );

  useEffect(() => {
    refreshConfirmedAccount();
    refreshCrowdloans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MultisigContext.Provider
      value={{
        ...value,
        setIsPageLock,
        confirmedAccount: data?.transfers.totalCount ?? 0,
        crowdloans: updateData.data?.crowdloans.totalCount ?? 0,
        refreshConfirmedAccount,
        refreshCrowdloans,
      }}
    >
      <Spin size="large" spinning={isPageLocked}>
        {children}
      </Spin>
    </MultisigContext.Provider>
  );
};
