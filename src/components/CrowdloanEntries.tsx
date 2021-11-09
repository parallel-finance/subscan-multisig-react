import BaseIdentityIcon from '@polkadot/react-identicon';
import { KeyringAddress } from '@polkadot/ui-keyring/types';
import { Button, Collapse, Empty, Space, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useIsInjected } from '../hooks';
import { CrowdloanEntry, CrowdloanActionType } from '../model';
// import { genExpandIcon } from './expandIcon';
import { SubscanLink } from './SubscanLink';

export interface CrowdloanEntriesProps {
  source: CrowdloanEntry[];
  account: KeyringAddress;
}

const { Title } = Typography;
const { Panel } = Collapse;

const renderHeight = (entry: CrowdloanEntry) => {
  const { height } = entry;
  return (
    <SubscanLink block={height}>
      <Trans>{height}</Trans>
    </SubscanLink>
  );
};

const renderAddress = (entry: CrowdloanEntry) => {
  const { address } = entry;
  return (
    <SubscanLink address={address}>
      <Trans>{address}</Trans>
    </SubscanLink>
  );
};

const renderCrowdloanContribution = (entry: CrowdloanEntry) => {
  const { paraId, amount } = entry;
  return renderContribution(paraId, amount);
};

const renderContribution = (paraId: string, amount: string) => {
  return (
    <Trans>
      {paraId}, {amount}
    </Trans>
  );
};

const renderStatus = (entry: CrowdloanEntry) => {
  const { status } = entry;
  return <Trans>{status}</Trans>;
};

export function CrowdloanEntries({ source }: CrowdloanEntriesProps) {
  const { t } = useTranslation();
  const isInjected = useIsInjected();
  // const { network } = useApi();
  const renderAction = useCallback(
    // eslint-disable-next-line complexity
    (row: CrowdloanEntry) => {
      if (row.status) {
        return <span>{t(`status.${row.status}`)}</span>;
      }

      const actions: CrowdloanActionType[] = [];

      return (
        <Space>
          {actions.map((action) => {
            return (
              <Button key={action} disabled>
                {t(action)}
              </Button>
            );
          })}
        </Space>
      );
    },
    [isInjected, t]
  );

  const columns: ColumnsType<CrowdloanEntry> = [
    {
      title: t('height'),
      dataIndex: 'height',
      align: 'center',
      render: (_, row) => renderHeight(row),
    },
    {
      title: t('address'),
      dataIndex: 'address',
      align: 'center',
      render: (_, row) => renderAddress(row),
    },
    {
      title: t('contribution'),
      dataIndex: 'contribution',
      align: 'center',
      render: (_, row) => renderCrowdloanContribution(row),
    },
    {
      title: t('status.index'),
      key: 'status',
      align: 'center',
      render: (_, row) => renderStatus(row),
    },
  ];
  const expandedRowRender = (entry: CrowdloanEntry) => {
    const { address, paraId, amount } = entry;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressColumnsNested: ColumnsType<any> = [
      { dataIndex: 'paraId' },
      {
        dataIndex: 'address',
        render: () => (
          <Space size="middle">
            <BaseIdentityIcon theme="polkadot" size={32} value={address} />
            <SubscanLink address={address} copyable />
          </Space>
        ),
      },
      {
        key: 'contribution',
        render: () => renderContribution(paraId, amount),
      },
    ];

    return (
      <>
        <Title level={5}>{t('Specifics')}</Title>
        <Table
          columns={progressColumnsNested}
          pagination={false}
          bordered
          rowKey={(record) => record.blockHash ?? (record.blockHash as string)}
          showHeader={false}
          className="mb-4 mx-4"
        />
      </>
    );
  };

  console.warn(typeof expandedRowRender);
  return (
    <>
      <Table
        dataSource={source}
        columns={columns}
        rowKey={(record) => record.blockHash ?? (record.blockHash as string)}
        pagination={false}
        expandable={
          {
            // expandedRowRender,
            // expandIcon: genExpandIcon(network),
          }
        }
        // className="lg:block hidden"
      ></Table>

      <Space direction="vertical" className="lg:hidden block">
        {source.map((data) => {
          const { status, address, paraId, amount } = data;
          console.warn(`status is ${status}, address is ${address}, paraId is ${paraId}, amount, height`);
          return (
            <Collapse key={address} expandIcon={() => <></>} className="wallet-collapse">
              <Panel
                header={
                  <Space direction="vertical" className="w-full mb-4">
                    <Typography.Text className="mr-4" copyable>
                      {status}
                    </Typography.Text>

                    <div className="flex items-center">
                      <Typography.Text>{renderContribution(paraId, amount)}</Typography.Text>
                    </div>
                  </Space>
                }
                key={address}
                extra={renderAction(data)}
                className="overflow-hidden mb-4"
              ></Panel>
            </Collapse>
          );
        })}

        {!source.length && <Empty />}
      </Space>
    </>
  );
}
