import React, { useMemo } from 'react';
import JazzIcon, { JazzIconProps } from './JazzIcon';
import Image from 'next/image';

type ProfileIconProps = { src?: string } & JazzIconProps;

function ProfileIcon({ src, ...jazzIconProps }: ProfileIconProps) {
  const imageSrc = useMemo(() => src || null, [src]);

  return imageSrc ? (
    <Image
      className={`rounded-full object-cover ${jazzIconProps.className}`}
      src={imageSrc}
      width={jazzIconProps.size}
      height={jazzIconProps.size}
      alt={`Profile picture of ${jazzIconProps.address}`}
    />
  ) : (
    <JazzIcon {...jazzIconProps} />
  );
}

export default ProfileIcon;
