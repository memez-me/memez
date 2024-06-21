// inspired by https://github.com/metaphor-xyz/davatar-helpers/blob/master/packages/react/src/Jazzicon.tsx
import React from 'react';
import Color from 'color';
import MersenneTwister from 'mersenne-twister';
import { Address } from 'viem';

// MetaMask colors
const colors = [
  '#01888C', // teal
  '#FC7500', // bright orange
  '#034F5D', // dark teal
  '#F73F01', // orangered
  '#FC1960', // magenta
  '#C7144C', // raspberry
  '#F3C100', // goldenrod
  '#1598F2', // lightning blue
  '#2465E1', // sail blue
  '#F19E02', // gold
];

const wobble = 30;
const shapeCount = 3;

export type JazzIconProps = {
  address: Address;
  size: number;
  className?: string;
};

function JazzIcon({ address, size, className }: JazzIconProps) {
  const seed = parseInt(address.slice(2, 10), 16);

  const generator = new MersenneTwister(seed);
  const amount = generator.random() * 30 - wobble / 2;

  const localColors = colors.map((hex) => new Color(hex).rotate(amount).hex());

  const randomColor = () => {
    generator.random();
    const idx = Math.floor(localColors.length * generator.random());
    return localColors.splice(idx, 1)[0];
  };

  const backgroundColor = randomColor();

  const shapes = [...new Array(shapeCount)].map((_, index) => {
    const center = size / 2;

    const firstRot = generator.random();
    const angle = Math.PI * 2 * firstRot;
    const velocity =
      (size / shapeCount) * generator.random() + (index * size) / shapeCount;

    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;

    const secondRot = generator.random();
    const rot = firstRot * 360 + secondRot * 180;
    const fill = randomColor();

    return (
      <rect
        key={`shape_${index}`}
        x={0}
        y={0}
        width={size}
        height={size}
        fill={fill}
        transform={`translate(${tx} ${ty}) rotate(${rot.toFixed(1)} ${center} ${center})`}
      />
    );
  });

  return (
    <svg
      className={`overflow-hidden rounded-full ${className}`}
      width={size}
      height={size}
    >
      <rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
      {shapes}
    </svg>
  );
}

export default JazzIcon;
