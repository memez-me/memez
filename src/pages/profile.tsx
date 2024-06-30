import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { useRouter } from 'next/router';
import { Address, isAddress, zeroAddress } from 'viem';
import { trimAddress } from '../utils';
import { PrimaryButton } from '../components/buttons';
import TextInput from '../components/TextInput';
import { useMemeCoinConfig, useMemezFactoryConfig } from '../hooks';
import _ from 'lodash';
import MemeCoinCard from '../components/MemeCoinCard';
import { ProfileIcon } from '../components/icons';

type MemeCoinPartialData = {
  name: string;
  symbol: string;
  description: string | '';
  image: string | '';
  cap: bigint | 0n;
  reserveBalance: bigint | 0n;
};

const memecoinFunctionsToCall = [
  'name',
  'symbol',
  'description',
  'image',
  'cap',
  'reserveBalance',
] as (keyof MemeCoinPartialData)[];

export function Profile() {
  const { address } = useAccount();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const memezFactoryConfig = useMemezFactoryConfig();
  const memeCoinConfig = useMemeCoinConfig(zeroAddress); // address will be overridden

  const profileAddress = useMemo(
    () =>
      isAddress(router?.query?.address?.toString() ?? '')
        ? (router?.query?.address as Address)
        : zeroAddress,
    [router],
  );

  const isCurrent = useMemo(
    () => address?.toLowerCase() === profileAddress.toLowerCase(),
    [address, profileAddress],
  );

  const { data: accountInfo, refetch: refetchAccountInfo } = useReadContract({
    ...memezFactoryConfig,
    functionName: 'accounts',
    args: [profileAddress],
    query: {
      enabled: profileAddress !== zeroAddress,
    },
  });

  const { data: memecoinsAddressesData } = useReadContracts({
    contracts: [...new Array(Number(accountInfo?.[2] ?? 0)).keys()].map(
      (i) =>
        ({
          ...memezFactoryConfig,
          functionName: 'memecoinsByCreators',
          args: [profileAddress, i],
        }) as const,
    ),
    query: {
      enabled: !!accountInfo && accountInfo[2] > 0n,
    },
  });

  const memecoinsAddresses = useMemo(
    () =>
      (memecoinsAddressesData ?? [])
        .filter((res) => res.status === 'success')
        .map(({ result }) => result!),
    [memecoinsAddressesData],
  );

  const { data: memecoinsInfo } = useReadContracts({
    contracts: (memecoinsAddresses ?? []).flatMap((address) =>
      memecoinFunctionsToCall.map((functionName) => ({
        ...memeCoinConfig,
        address,
        functionName,
        args: [],
      })),
    ),
    query: {
      enabled: memecoinsAddresses.length > 0,
      refetchInterval: 5000,
    },
  });

  const memecoinsData = useMemo(
    () =>
      _.chunk(memecoinsInfo ?? [], memecoinFunctionsToCall.length).map(
        (memecoinData, i) => ({
          ...(_.fromPairs(
            _.zip(
              memecoinFunctionsToCall,
              memecoinData.map((data) => data.result),
            ),
          ) as MemeCoinPartialData),
          address: memecoinsAddresses[i],
        }),
      ),
    [memecoinsInfo, memecoinsAddresses],
  );

  const { data, error } = useSimulateContract({
    ...memezFactoryConfig,
    functionName: 'updateAccountInfo',
    args: [nickname, profilePicture],
    query: {
      enabled: isCurrent && isEditing,
    },
  });

  const simulationError = useMemo(
    () => (error ? (error.cause as any)?.reason ?? error.message : null),
    [error],
  );

  const {
    data: hash,
    writeContractAsync,
    isPending,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!accountInfo) return;
    setNickname((old) => accountInfo[0] || old);
    setProfilePicture((old) => accountInfo[1] || old);
  }, [accountInfo]);

  const saveChanges = useCallback(() => {
    writeContractAsync(data!.request)
      .then(() => {
        refetchAccountInfo().then(() => {
          setIsEditing(false);
          reset();
        });
      })
      .catch((e) => console.error(e));
  }, [writeContractAsync, data, refetchAccountInfo, reset]);

  const nicknameToShow = useMemo(
    () => (isEditing ? nickname : accountInfo?.[0] || nickname),
    [accountInfo, isEditing, nickname],
  );

  return (
    <>
      <PageHead
        title="memez"
        subtitle={nicknameToShow ?? profileAddress}
        description={`memez ${nicknameToShow ?? profileAddress} profile`}
      />
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-col gap-4 items-center w-full mt-6">
          {profileAddress !== zeroAddress ? (
            <>
              <div className="flex flex-col gap-4 w-full max-w-[420px] text-body tracking-body">
                <div className="flex flex-row gap-2 overflow-hidden overflow-ellipsis">
                  <ProfileIcon
                    className="shrink-0"
                    address={profileAddress}
                    size={64}
                    src={profilePicture}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <h1 className="text-title font-bold overflow-hidden overflow-ellipsis">
                      {nicknameToShow || <i>No nickname</i>}
                    </h1>
                    <h2 className="text-body-2 font-medium">
                      {trimAddress(profileAddress)}
                    </h2>
                  </div>
                </div>
                {isCurrent &&
                  (isEditing ? (
                    <>
                      <TextInput
                        value={nickname}
                        placeholder="Nickname"
                        type="text"
                        disabled={isPending || isConfirming}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                      {/*<TextInput*/}
                      {/*  placeholder="Profile picture"*/}
                      {/*  type="file"*/}
                      {/*  onChange={(e) => {*/}
                      {/*    const file = e.target.files?.[0];*/}
                      {/*    if (!file) return;*/}
                      {/*    const reader = new FileReader();*/}
                      {/*    reader.readAsDataURL(file);*/}
                      {/*    reader.onload = (ev) => {*/}
                      {/*      const imageData = ev.target?.result;*/}
                      {/*      if (!imageData) return;*/}
                      {/*      setProfilePicture(imageData.toString());*/}
                      {/*    };*/}
                      {/*  }}*/}
                      {/*  accept="image/*"*/}
                      {/*/>*/}
                      <PrimaryButton
                        disabled={!data?.request || isPending || isConfirming}
                        onClick={saveChanges}
                      >
                        {isPending || isConfirming
                          ? 'Saving changes...'
                          : 'Save changes'}
                      </PrimaryButton>
                    </>
                  ) : (
                    <PrimaryButton onClick={() => setIsEditing(true)}>
                      Edit profile
                    </PrimaryButton>
                  ))}
                {isConfirmed && (
                  <p className="text-second-success">Changes saved!</p>
                )}
                {simulationError && (
                  <p className="text-second-error">Error: {simulationError}</p>
                )}
              </div>
              {memecoinsData.length > 0 && (
                <h3 className="text-title font-medium text-center">
                  Created Coins: {memecoinsData.length}
                </h3>
              )}
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 px-x2 py-x0.5 gap-x3 max-h-full overflow-auto">
                {memecoinsData.map(
                  ({
                    address,
                    name,
                    symbol,
                    description,
                    image,
                    cap,
                    reserveBalance,
                  }) => (
                    <MemeCoinCard
                      key={address}
                      address={address}
                      balance={reserveBalance}
                      cap={cap}
                      icon={image}
                      name={name}
                      symbol={symbol}
                      description={description}
                      creatorAddress={profileAddress}
                      creatorNickname={nicknameToShow}
                      creatorProfilePicture={profilePicture}
                    />
                  ),
                )}
              </div>
            </>
          ) : (
            <p className="text-second-error">
              Error: cannot parse profile address!
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
