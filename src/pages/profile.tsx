import React, { useCallback, useMemo, useState } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import { useAccount, useSignTypedData } from 'wagmi';
import { useRouter } from 'next/router';
import { Address, Hash, isAddress, zeroAddress } from 'viem';
import { trimAddress } from '../utils';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { keccak256 } from 'ethereumjs-util/dist/hash';

export function Profile() {
  const { address } = useAccount();
  const router = useRouter();
  const [nickname, setNickname] = useState('Nickname');
  const [profilePicture, setProfilePicture] = useState('/icon.png');
  const [isEditing, setIsEditing] = useState(false);

  const { signTypedDataAsync } = useSignTypedData();

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

  const saveChanges = useCallback(() => {
    signTypedDataAsync({
      types: {
        Profile: [
          { name: 'action', type: 'string' },
          { name: 'time', type: 'uint256' },
          { name: 'nickname', type: 'string' },
          { name: 'profilePictureHash', type: 'bytes' },
        ],
      },
      primaryType: 'Profile',
      message: {
        action: 'Update profile',
        time: BigInt(Math.round(Date.now() / 1000)),
        nickname: nickname,
        profilePictureHash: keccak256(profilePicture).toString() as Hash,
      },
    })
      .then((signature) => {
        console.log(signature); //TODO
        setIsEditing(false);
      })
      .catch((e) => console.error(e));
  }, [nickname, profilePicture, signTypedDataAsync]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle={nickname ?? profileAddress}
        description={`memez ${nickname ?? profileAddress} profile`}
      />
      <div className="flex flex-col h-full justify-center items-center">
        <Link
          href="/"
          passHref
          rel="noreferrer"
          className="hover:font-bold hover:text-text-hovered"
        >
          [go back]
        </Link>
        <div className="flex flex-col gap-4 w-full max-w-[420px] mt-6">
          {profileAddress !== zeroAddress ? (
            <>
              <div className="flex flex-row gap-2">
                <img
                  src={profilePicture}
                  width={64}
                  height={64}
                  alt={`Profile picture of ${nickname}`}
                />
                <div className="flex flex-col gap-1">
                  <h1 className="font-semibold">
                    {nickname || <i>No nickname</i>}
                  </h1>
                  <h2>{trimAddress(profileAddress)}</h2>
                </div>
              </div>
              {isCurrent &&
                (isEditing ? (
                  <>
                    <TextInput
                      value={nickname}
                      placeholder="Nickname"
                      type="text"
                      onChange={(e) => setNickname(e.target.value)}
                    />
                    <TextInput
                      placeholder="Profile picture"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = (ev) => {
                          const imageData = ev.target?.result;
                          if (!imageData) return;
                          setProfilePicture(imageData.toString());
                        };
                      }}
                      accept="image/*"
                    />
                    <Button
                      className="text-text-success border-text-success"
                      onClick={saveChanges}
                    >
                      Save changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit profile
                  </Button>
                ))}
            </>
          ) : (
            <p className="text-text-error">
              Error: cannot parse profile address!
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
