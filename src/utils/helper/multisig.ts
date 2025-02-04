import { ApiPromise } from '@polkadot/api';
import { Call } from '@polkadot/types/interfaces';
import keyring from '@polkadot/ui-keyring';
import { KeyringAddress } from '@polkadot/ui-keyring/types';
import { u8aToHex } from '@polkadot/util';
import { createKeyMulti } from '@polkadot/util-crypto';
import store from 'store';
import { NETWORKS } from '../../config';
import { Network, ShareScope, WalletFormValue } from '../../model';

interface MultiInfo {
  isMultisig: boolean;
  threshold: number;
  who: string[];
}

export function extractExternal(accountId: string | undefined | null): MultiInfo {
  if (!accountId) {
    return { isMultisig: false, threshold: 0, who: [] };
  }

  let publicKey;

  try {
    publicKey = keyring.decodeAddress(accountId);
  } catch (error) {
    console.error(error);

    return { isMultisig: false, threshold: 0, who: [] };
  }

  const pair = keyring.getPair(publicKey);

  return {
    isMultisig: !!pair.meta.isMultisig,
    threshold: (pair.meta.threshold || 0) as number,
    who: ((pair.meta.who as string[]) || []).map((addr) => keyring.encodeAddress(keyring.decodeAddress(addr))),
  };
}

export const txMethod = (data: Call | undefined | null, api: ApiPromise | null): string => {
  if (!data || !api) {
    return '-';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = data?.toHuman() as any;

  if (call) {
    const meta = api.tx[call.section][call.method].meta.toJSON();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${call.section}.${call.method}(${(meta.args as any[]).map((item) => item.name).join(',')})`;
  }

  return '-';
};

export const txMethodDescription = (
  data: Call | undefined | null,
  api: ApiPromise | null
): { name: string; type: string; value: string }[] => {
  if (!data || !api) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const call = data.toHuman() as any;

  if (call) {
    const meta = api.tx[call.section][call.method].meta.toJSON();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callJson = data.toJSON() as any;
    const params = meta.args as { name: string; type: string }[];

    return params.map(({ name, type }) => {
      const value = callJson.args[name];

      return {
        name,
        type,
        value: typeof value === 'object' ? Object.values(value).join(' ') : value,
      };
    });
  }

  return [];
};

export const txDoc = (data: Call | undefined | null): string => {
  if (!data) {
    return '-';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.meta as any).get('documentation').toHuman().join('');
};

export function findMultiAccount({
  threshold,
  members,
}: Pick<WalletFormValue, 'members' | 'threshold'>): KeyringAddress | null {
  const existsAccounts = keyring.getAccounts().filter((account) => account.meta.isMultisig);
  const key = createKeyMulti(
    members.map((item) => item.address),
    threshold
  );

  return existsAccounts.find((acc) => acc.publicKey.toString() === key.toString()) ?? null;
}

function scopeKey(publicKey: Uint8Array) {
  return `scope:${u8aToHex(publicKey)}`;
}

export function updateMultiAccountScope(
  { share, scope = [], members, threshold }: WalletFormValue,
  network: Network
): void {
  const networks = ShareScope.custom === share ? (scope as Network[]) : share === ShareScope.all ? NETWORKS : [network];
  const key = createKeyMulti(
    members.map((item) => item.address),
    threshold
  );

  store.set(scopeKey(key), networks);
}

export function isInCurrentScope(publicKey: Uint8Array, network: Network): boolean {
  const scope: Network[] = store.get(scopeKey(publicKey)) ?? null;

  return scope && scope.includes(network);
}
