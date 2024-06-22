import React, { useMemo } from 'react';
import { JazzIconProps } from './JazzIcon';
import Image from 'next/image';
import MersenneTwister from 'mersenne-twister';
import Color from 'color';

type CoinIconProps = {
  symbol: string;
  src?: string;
} & JazzIconProps;

const colors = [
  //'#92FFCB', // accent
  '#00FF85', // light
  '#20573D', // shadow
  '#313D38', // gray
  //'#47514C', // grey
  '#000A05', // black
  '#FF6B4A', // sell
  '#FF532E', // error
  '#FFC700', // warning
  '#2FFF50', // success
];

const wobble = 30;
const shapeCount = 5;

function CustomJazzIcon({
  address,
  size,
  symbol,
  className,
}: JazzIconProps & { symbol: string }) {
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
      <>
        <ellipse
          key={`shape_${index}_0`}
          cx={0}
          cy={0}
          rx={size / 2}
          ry={size}
          fill={fill}
          transform={`translate(${tx} ${ty}) rotate(${rot.toFixed(1)} ${center} ${center})`}
        />
        <ellipse
          key={`shape_${index}_1`}
          cx={0}
          cy={0}
          rx={size}
          ry={size / 2}
          fill={fill}
          transform={`translate(${tx} ${ty}) rotate(${rot.toFixed(1)} ${center} ${center})`}
        />
      </>
    );
  });

  const fontSize = (size / (symbol.length || 3)) * 0.85;

  return (
    <svg
      className={`overflow-hidden rounded-full ${className}`}
      width={size}
      height={size}
    >
      <rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
      {shapes}
      <circle cx={size / 2} cy={size / 2} r={size / 3} fill="#47514C80" />
      {symbol && (
        <text
          className="text-shadow pointer-events-none"
          textLength={size / 2}
          lengthAdjust="spacing"
          x={'50%'}
          y={'50%'}
          fontSize={fontSize}
          fontWeight={700}
          fill="#92FFCB"
          alignmentBaseline="middle"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {symbol}
        </text>
      )}
    </svg>
  );
}

function CoinIcon({ src, ...otherProps }: CoinIconProps) {
  const imageSrc = useMemo(() => src || null, [src]);

  return imageSrc ? (
    <Image
      className={`rounded-full object-contain ${otherProps.className}`}
      src={imageSrc}
      width={otherProps.size}
      height={otherProps.size}
      alt={`Profile picture of ${otherProps.address}`}
    />
  ) : (
    <CustomJazzIcon {...otherProps} />
  );
}

export default CoinIcon;
