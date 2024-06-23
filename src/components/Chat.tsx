import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, zeroAddress } from 'viem';
import { useMemezFactoryConfig } from '../hooks';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import _ from 'lodash';
import TextInput from './TextInput';
import { PrimaryButton } from './buttons';
import { trimAddress } from '../utils';
import Link from 'next/link';
import { LikeIcon, ProfileIcon } from './icons';

type AccountPartialInfo = {
  nickname: string;
  profilePicture: string;
};

type ChatProps = {
  memecoin: Address;
  className?: string;
};

function Chat({ memecoin, className }: ChatProps) {
  const { address } = useAccount();
  const [text, setText] = useState('');
  const [accounts, setAccounts] = useState<Record<Address, AccountPartialInfo>>(
    {},
  );

  const memezChatConfig = useMemezFactoryConfig();

  const { data: messagesCount = 0n, refetch: refetchCount } = useReadContract({
    ...memezChatConfig,
    functionName: 'getThreadLength',
    args: [memecoin],
    query: {
      enabled: memecoin !== zeroAddress,
      refetchInterval: 5000,
    },
  });

  const { data: messages, refetch: refetchMessages } = useReadContracts({
    contracts: [...new Array(Number(messagesCount))].map(
      (_, index) =>
        ({
          ...memezChatConfig,
          functionName: 'threads',
          args: [memecoin, BigInt(index)],
        }) as const,
    ),
    query: {
      enabled: messagesCount > 0n,
    },
  });

  const { data: likes, refetch: refetchLikes } = useReadContracts({
    contracts: [...new Array(Number(messagesCount))].map(
      (_, index) =>
        ({
          ...memezChatConfig,
          functionName: 'isThreadMessageLikedByUser',
          args: [memecoin, BigInt(index), address!],
        }) as const,
    ),
    query: {
      enabled: messagesCount > 0n && !!address,
    },
  });

  const allUsersAddresses = useMemo(
    () =>
      new Set((messages ?? []).map(({ result }) => result?.[1] ?? zeroAddress)),
    [messages],
  );

  const notCachedUsers = useMemo(
    () => [...allUsersAddresses].filter((address) => !accounts[address]),
    [accounts, allUsersAddresses],
  );

  const { data: fetchedUsers } = useReadContracts({
    contracts: notCachedUsers.map(
      (profileAddress) =>
        ({
          ...memezChatConfig,
          functionName: 'accounts',
          args: [profileAddress],
        }) as const,
    ),
    query: {
      enabled: notCachedUsers.length > 0,
    },
  });

  useEffect(() => {
    if (!fetchedUsers) return;
    const newUsers = _.fromPairs(
      _.zip(
        notCachedUsers,
        fetchedUsers.map(({ result }) =>
          result
            ? ({
                nickname: result[0],
                profilePicture: result[1],
              } as AccountPartialInfo)
            : undefined,
        ),
      ),
    );
    setAccounts((previous) => ({
      ...previous,
      ...newUsers,
    }));
  }, [notCachedUsers, fetchedUsers]);

  const { data: addMessageData, error: addMessageError } = useSimulateContract({
    ...memezChatConfig,
    functionName: 'addMessage',
    args: [memecoin, text],
    query: {
      enabled: memecoin !== zeroAddress && !!text,
    },
  });

  const addMessageSimulationError = useMemo(
    () =>
      addMessageError
        ? (addMessageError.cause as any)?.reason ?? addMessageError.message
        : null,
    [addMessageError],
  );

  const {
    data: addMessageHash,
    writeContractAsync: writeAddMessageContractAsync,
    isPending: isAddMessagePending,
    reset: resetAddMessage,
  } = useWriteContract();

  const { isLoading: isAddMessageConfirming } = useWaitForTransactionReceipt({
    hash: addMessageHash,
  });

  const sendMessage = useCallback(() => {
    writeAddMessageContractAsync(addMessageData!.request)
      .then(() => {
        refetchCount().then(() =>
          Promise.all([refetchMessages(), refetchLikes()]).then(() => {
            setText('');
            resetAddMessage();
          }),
        );
      })
      .catch((e) => console.error(e));
  }, [
    writeAddMessageContractAsync,
    addMessageData,
    refetchCount,
    refetchMessages,
    refetchLikes,
    resetAddMessage,
  ]);

  const { writeContractAsync: writeLikeMessageContractAsync } =
    useWriteContract();

  return (
    <div className={`flex flex-col gap-x2 ${className}`}>
      <h1 className="text-title font-medium text-center">Chat</h1>
      <div className="flex flex-row gap-x1">
        <TextInput
          className="flex-1"
          value={text}
          placeholder="Text message"
          type="text"
          disabled={isAddMessagePending || isAddMessageConfirming}
          onChange={(e) => setText(e.target.value)}
        />
        <PrimaryButton
          className="h-x9"
          disabled={
            !addMessageData?.request ||
            isAddMessagePending ||
            isAddMessageConfirming
          }
          onClick={sendMessage}
        >
          {isAddMessageConfirming || isAddMessagePending
            ? 'Sending...'
            : 'Send'}
        </PrimaryButton>
      </div>
      {addMessageSimulationError && (
        <p className="text-second-error">Error: {addMessageSimulationError}</p>
      )}
      <div className="flex flex-col-reverse gap-x2">
        {messages && messages.length > 0 ? (
          messages
            .filter((m) => !!m.result)
            .map(
              ({ result }, i) =>
                result && (
                  <div
                    key={i}
                    className="flex flex-col py-x1 border-b first:border-0 border-main-shadow"
                  >
                    <div className="flex flex-row gap-x1">
                      <div className="min-w-0 overflow-hidden overflow-ellipsis text-nowrap">
                        <Link
                          href={`/profile?address=${result[1]}`}
                          passHref
                          rel="noreferrer"
                          className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
                        >
                          {!accounts[result[1]] ? (
                            trimAddress(result[1])
                          ) : (
                            <>
                              <ProfileIcon
                                className="inline"
                                address={result[1]}
                                size={16}
                                src={accounts[result[1]].profilePicture}
                              />{' '}
                              {accounts[result[1]].nickname ||
                                trimAddress(result[1])}
                            </>
                          )}{' '}
                          {address === result[1] && <i>(You)</i>}
                        </Link>
                      </div>
                      <div className="flex flex-row gap-x0.5 shrink-0 items-center text-footnote font-regular tracking-footnote content-center">
                        <button
                          onClick={() =>
                            writeLikeMessageContractAsync({
                              ...memezChatConfig,
                              functionName: 'likeMessage',
                              args: [memecoin, BigInt(i)],
                            }).then(
                              () =>
                                Promise.all([
                                  refetchMessages(),
                                  refetchLikes(),
                                ]),
                              (e) => console.error(e),
                            )
                          }
                        >
                          <LikeIcon isActive={likes?.[i]?.result} size={20} />
                        </button>
                        <span>{result[3]}</span>
                      </div>
                      <span className="ml-auto shrink-0 text-right text-footnote font-regular tracking-footnote content-center">
                        {new Date(result[2] * 1000).toLocaleString()}
                      </span>
                    </div>
                    <p>{result[0]}</p>
                  </div>
                ),
            )
        ) : (
          <h4 className="text-title font-medium text-center">
            No messages yet
          </h4>
        )}
      </div>
    </div>
  );
}

export default Chat;
