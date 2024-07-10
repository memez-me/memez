import axios from 'axios';
import { Address, Hex } from 'viem';

const API_URL = 'https://vs1w1flhb5.execute-api.us-east-1.amazonaws.com/';

const chatAxiosApi = axios.create({
  baseURL: API_URL,
});

export type ChatAuth = {
  timestamp: number;
  signature: Hex;
};

export type ChatMessage = {
  id: string;
  memecoin: Address;
  author: Address;
  message: string;
  timestamp: number;
  likes: number;
};

export type ChatMessageLike = {
  id: `${string}-${Address}`;
  messageId: ChatMessage['id'];
  user: Address;
};

const TTL = 24 * 60 * 60; // 1 day

export function getMessageToSign() {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    timestamp,
    message: `Signing in on memez.me at ${timestamp}`,
  };
}

export function getIsNewSignatureNeeded(user: Address) {
  const auth = JSON.parse(
    sessionStorage.getItem(user) ?? 'null',
  ) as ChatAuth | null;
  return !auth || auth.timestamp + TTL <= Date.now() / 1000;
}

export function saveSignedMessage(
  user: Address,
  timestamp: number,
  signature: Hex,
) {
  sessionStorage.setItem(
    user,
    JSON.stringify({
      timestamp,
      signature,
    } as ChatAuth),
  );
}

export async function getMessages(memecoin: Address, from: number = 0) {
  const res = await chatAxiosApi.get<ChatMessage[]>(
    `/messages/${memecoin}?from=${from}`,
  );
  return res?.data ?? [];
}

export async function sendMessage(
  memecoin: Address,
  message: string,
  user: Address,
) {
  const auth = JSON.parse(sessionStorage.getItem(user) ?? 'null') as ChatAuth;
  const res = await chatAxiosApi.post<ChatMessage>(`/messages/${memecoin}`, {
    auth,
    message,
  });
  return res?.data ?? null;
}

export async function getLikes(user: Address) {
  const res = await chatAxiosApi.get<ChatMessageLike[]>(`/likes/${user}`);
  return res?.data ?? [];
}

export async function likeMessage(messageId: string, user: Address) {
  const auth = JSON.parse(sessionStorage.getItem(user) ?? 'null') as ChatAuth;
  const res = await chatAxiosApi.post<{ likes: number }>(
    `/message/${messageId}/like`,
    {
      auth,
    },
  );
  return res?.data ?? null;
}

export async function unlikeMessage(messageId: string, user: Address) {
  const auth = JSON.parse(sessionStorage.getItem(user) ?? 'null') as ChatAuth;
  const res = await chatAxiosApi.post<{ likes: number }>(
    `/message/${messageId}/unlike`,
    {
      auth,
    },
  );
  return res?.data ?? null;
}
