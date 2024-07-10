import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

const CustomJazzIcon = forwardRef(
  (
    { address, size, symbol, className }: JazzIconProps & { symbol: string },
    ref: ForwardedRef<SVGSVGElement>,
  ) => {
    const seed = parseInt(address.slice(2, 10), 16);

    const generator = new MersenneTwister(seed);
    const amount = generator.random() * 30 - wobble / 2;

    const localColors = colors.map((hex) =>
      new Color(hex).rotate(amount).hex(),
    );

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
        <g key={`shape_group_${index}`}>
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
        </g>
      );
    });

    const fontSize = (size / (symbol.length || 3)) * 0.85;

    return (
      <svg
        ref={ref}
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
  },
);
CustomJazzIcon.displayName = 'CustomJazzIcon';

const IPFS_URL = 'https://purple-central-swan-424.mypinata.cloud/ipfs/';

function CoinIcon({ src, className, ...otherProps }: CoinIconProps) {
  const svgIconRef = useRef<SVGSVGElement>(null);
  const [isComponentRendered, setIsComponentRendered] = useState(false);
  const [isError, setIsError] = useState(false);

  const imageSrc = useMemo(
    () =>
      isError || !src
        ? null
        : src.startsWith('ipfs://')
          ? src.replace('ipfs://', IPFS_URL) +
            `?img-width=${otherProps.size}&img-height=${otherProps.size}&img-fit=cover&img-dpr=2&img-onerror=redirect`
          : src.startsWith('blob:') || src.startsWith('/')
            ? src
            : null,
    [isError, otherProps.size, src],
  );

  const fallbackSrc = useMemo(() => {
    if (!isComponentRendered || !imageSrc || !svgIconRef.current)
      return undefined;
    const serializer = new XMLSerializer();
    const htmlString = serializer.serializeToString(svgIconRef.current);
    return `data:image/svg+xml;base64,${window.btoa(htmlString)}` as `data:image/${string}`;
  }, [isComponentRendered, imageSrc, svgIconRef]);

  useEffect(() => {
    setIsComponentRendered(true);
  }, []);

  return (
    <>
      {!!imageSrc && (
        <Image
          className={`rounded-x4 object-cover ${className}`}
          src={imageSrc}
          crossOrigin="anonymous"
          width={otherProps.size}
          height={otherProps.size}
          alt={`Icon of ${otherProps.symbol || otherProps.address} token`}
          onError={() => setIsError(true)}
          placeholder={fallbackSrc ? 'blur' : undefined}
          blurDataURL={fallbackSrc}
        />
      )}
      <CustomJazzIcon
        ref={svgIconRef}
        className={`rounded-x4 ${!!imageSrc ? 'hidden' : ''} ${className}`}
        {...otherProps}
      />
    </>
  );
}

export default CoinIcon;
