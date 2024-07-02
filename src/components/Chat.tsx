import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, zeroAddress } from 'viem';
import { useMemezFactoryConfig } from '../hooks';
import { useAccount, useReadContracts, useSignMessage } from 'wagmi';
import _ from 'lodash';
import TextInput from './TextInput';
import { PrimaryButton } from './buttons';
import { trimAddress } from '../utils';
import Link from 'next/link';
import { LikeIcon, ProfileIcon } from './icons';
import {
  ChatMessage,
  getIsNewSignatureNeeded,
  getLikes,
  getMessages,
  getMessageToSign,
  likeMessage,
  saveSignedMessage,
  sendMessage,
  unlikeMessage,
} from '../apis';

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
  const [isPending, setIsPending] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [likedMapping, setLikedMapping] = useState<
    Record<Address, Record<string, boolean>>
  >({});
  const [accounts, setAccounts] = useState<Record<Address, AccountPartialInfo>>(
    {},
  );

  const orderedMessages = useMemo(
    () => messages.sort((a, b) => a.timestamp - b.timestamp),
    [messages],
  );

  const memezChatConfig = useMemezFactoryConfig();

  useEffect(() => {
    setMessages([]);
    setText('');
    if (memecoin === zeroAddress) return;
    getMessages(memecoin).then((newMessages) => setMessages(newMessages ?? []));
  }, [memecoin]);

  const lastMessageTimestamp = useMemo(
    () => _.last(messages)?.timestamp ?? 0,
    [messages],
  );

  useEffect(() => {
    if (memecoin === zeroAddress) return;
    const interval = setInterval(
      () =>
        getMessages(memecoin, lastMessageTimestamp).then((newMessages) =>
          setMessages((old) => _.uniqBy([...old, ...newMessages], 'id')),
        ),
      5000,
    );
    return () => clearInterval(interval);
  }, [memecoin, lastMessageTimestamp]);

  useEffect(() => {
    if (!address) return;
    getLikes(address).then((likes) =>
      setLikedMapping((old) => ({
        ...old,
        [address]: _.fromPairs(likes.map((like) => [like.messageId, true])),
      })),
    );
  }, [address]);

  const allUsersAddresses = useMemo(
    () => new Set((messages ?? []).map(({ author }) => author)),
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

  const { signMessageAsync } = useSignMessage();

  const sendChatMessage = useCallback(async () => {
    if (!address || memecoin === zeroAddress) return;
    setIsPending(true);
    try {
      if (getIsNewSignatureNeeded(address)) {
        const { timestamp, message } = getMessageToSign();
        const signature = await signMessageAsync({ message });
        saveSignedMessage(address, timestamp, signature);
      }
      const message = await sendMessage(memecoin, text, address);
      setMessages((old) => [...old, message]);
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  }, [address, memecoin, signMessageAsync, text]);

  const likeChatMessage = useCallback(
    async (messageId: string) => {
      if (!address || !messageId) return;
      setIsPending(true);
      try {
        if (getIsNewSignatureNeeded(address)) {
          const { timestamp, message } = getMessageToSign();
          const signature = await signMessageAsync({ message });
          saveSignedMessage(address, timestamp, signature);
        }

        const { likes } = await (
          likedMapping[address]?.[messageId] ? unlikeMessage : likeMessage
        )?.(messageId, address);
        setMessages((old) => [
          ...old.filter((msg) => msg.id !== messageId),
          {
            ...old.find((msg) => msg.id === messageId)!,
            likes,
          },
        ]);
        setLikedMapping((old) => ({
          ...old,
          [address]: {
            ...old[address],
            [messageId]: !old[address]?.[messageId],
          },
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsPending(false);
      }
    },
    [address, likedMapping, signMessageAsync],
  );

  return (
    <div className={`flex flex-col gap-x3 ${className}`}>
      <h2 className="font-bold text-headline-2 text-shadow">Chat</h2>
      <div className="sticky top-0 flex flex-row gap-x1">
        <TextInput
          className="flex-1"
          value={text}
          placeholder="Send message"
          type="text"
          isSmall
          disabled={isPending}
          onChange={(e) => setText(e.target.value)}
        />
        <PrimaryButton
          isSmall
          disabled={!text || isPending}
          onClick={sendChatMessage}
        >
          Send
        </PrimaryButton>
      </div>
      <div className="flex flex-col-reverse gap-x1 overflow-x-hidden">
        {orderedMessages.length > 0 ? (
          orderedMessages.map(({ id, likes, timestamp, author, message }) => (
            <div
              key={id}
              className="flex flex-col gap-x0.5 px-x3 py-x2 bg-main-black bg-opacity-30 rounded-x1 backdrop-blur"
            >
              <div className="flex flex-row flex-wrap gap-x2 items-center">
                <div className="min-w-0 overflow-hidden overflow-ellipsis text-nowrap">
                  <Link
                    href={`/profile?address=${author}`}
                    passHref
                    rel="noreferrer"
                    className="flex flex-row flex-1 flex-nowrap items-center gap-x1 text-nowrap overflow-hidden overflow-ellipsis disabled:shadow hover:font-bold hover:text-shadow focus:text-shadow active:text-shadow"
                  >
                    <ProfileIcon
                      className="inline shrink-0"
                      address={author}
                      size={24}
                      src={accounts[author]?.profilePicture}
                    />
                    <span className="text-footnote font-regular tracking-footnote text-main-shadow bg-main-accent rounded-x0.5 h-x3 px-x0.5 content-center overflow-hidden overflow-ellipsis">
                      {accounts[author]?.nickname || trimAddress(author)}
                    </span>
                  </Link>
                </div>
                <div className="flex flex-row gap-x1 shrink-0 items-center text-footnote font-regular tracking-footnote content-center">
                  <button onClick={() => likeChatMessage(id)}>
                    <LikeIcon
                      isActive={address ? likedMapping[address]?.[id] : false}
                      size={32}
                    />
                  </button>
                  {likes > 0 && (
                    <span
                      className={`font-medium text-headline-2
                        ${
                          address && likedMapping[address]?.[id]
                            ? 'text-main-light'
                            : 'text-main-accent'
                        }
                      `}
                    >
                      {likes}
                    </span>
                  )}
                </div>
                <span
                  className={`ml-auto shrink-0 text-right text-footnote font-regular tracking-footnote content-center ${author === address ? 'text-main-light' : ''}`}
                >
                  {new Date(timestamp * 1000).toLocaleString()}
                </span>
              </div>
              <p className="text-body font-regular tracking-body">{message}</p>
            </div>
          ))
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
