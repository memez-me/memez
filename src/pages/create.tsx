import React, { useState, useMemo, useEffect } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import TextInput from '../components/TextInput';
import { PrimaryButton, SecondaryButton } from '../components/buttons';
import { useChartOptions, useMemezFactoryConfig } from '../hooks';
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { formatEther, parseEther, parseEventLogs } from 'viem';
import { useRouter } from 'next/router';
import { getPrice, getSupply } from '../utils';
import ApexChart from '../components/ApexChart';

const chartIntervalsCount = 50;

enum CreationStep {
  TokenInfo,
  Tokenomics,
  Finish,
}

export function Create() {
  const router = useRouter();
  const [step, setStep] = useState(CreationStep.TokenInfo);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [cap, setCap] = useState<string | number>('10');
  const [curveFactorN, setCurveFactorN] = useState<string | number>('1000');
  const [curveFactorD, setCurveFactorD] = useState<string | number>('');
  const [curvePowerN, setCurvePowerN] = useState<string | number>('3');
  const [curvePowerD, setCurvePowerD] = useState<string | number>('');

  const memezFactoryConfig = useMemezFactoryConfig();

  const nameError = useMemo(
    () =>
      name.length < 1
        ? 'Name is too short!'
        : name.length > 30
          ? 'Name is too long!'
          : null,
    [name],
  );
  const symbolError = useMemo(
    () =>
      symbol.length < 1
        ? 'Symbol is too short!'
        : symbol.length > 20
          ? 'Symbol is too long!'
          : null,
    [symbol],
  );
  const descriptionError = useMemo(
    () => (description.length > 200 ? 'Description is too long!' : null),
    [description],
  );
  const capError = useMemo(
    () => (!cap || Number(cap) < 1 ? 'Invalid cap!' : null),
    [cap],
  );
  const curveFactorNError = useMemo(
    () =>
      !curveFactorN || Number(curveFactorN) < 0
        ? 'Invalid curve factor numerator!'
        : null,
    [curveFactorN],
  );
  const curveFactorDError = useMemo(
    () =>
      !!curveFactorD && Number(curveFactorD) <= 0
        ? 'Invalid curve factor denominator!'
        : null,
    [curveFactorD],
  );
  const curvePowerNError = useMemo(
    () =>
      !curvePowerN || Number(curvePowerN) < 0
        ? 'Invalid curve power numerator!'
        : null,
    [curvePowerN],
  );
  const curvePowerDError = useMemo(
    () =>
      !!curvePowerD && Number(curvePowerD) <= 0
        ? 'Invalid curve power denominator!'
        : null,
    [curvePowerD],
  );

  const tokenInfoError = useMemo(
    () => nameError || symbolError || descriptionError,
    [nameError, symbolError, descriptionError],
  );

  const tokenomicsError = useMemo(
    () =>
      capError ||
      curveFactorNError ||
      curveFactorDError ||
      curvePowerNError ||
      curvePowerDError,
    [
      capError,
      curveFactorNError,
      curveFactorDError,
      curvePowerNError,
      curvePowerDError,
    ],
  );

  const isValidationError = useMemo(
    () => !!tokenInfoError || !!tokenomicsError,
    [tokenInfoError, tokenomicsError],
  );

  const maxSupply = useMemo(
    () =>
      !tokenomicsError
        ? getSupply(
            parseEther((cap || 0).toString()),
            parseEther((curvePowerN || 0).toString()),
            parseEther((curvePowerD || 1).toString()),
            parseEther((curveFactorN || 0).toString()),
            parseEther((curveFactorD || 1).toString()),
          )
        : 0n,
    [
      tokenomicsError,
      cap,
      curveFactorD,
      curveFactorN,
      curvePowerD,
      curvePowerN,
    ],
  );

  const chartData = useMemo(() => {
    if (!maxSupply || tokenomicsError) return undefined;
    const supplyStep = maxSupply / BigInt(chartIntervalsCount);

    return [...new Array(chartIntervalsCount + 1)]
      .map((_, i) => BigInt(i) * supplyStep)
      .map(
        (supply) =>
          [
            Number(formatEther(supply)),
            Number(
              formatEther(
                getPrice(
                  supply,
                  parseEther((curvePowerN || 0).toString()),
                  parseEther((curvePowerD || 1).toString()),
                  parseEther((curveFactorN || 0).toString()),
                  parseEther((curveFactorD || 1).toString()),
                ),
              ),
            ),
          ] as [number, number],
      );
  }, [
    curveFactorD,
    curveFactorN,
    curvePowerD,
    curvePowerN,
    maxSupply,
    tokenomicsError,
  ]);

  const chartOptions = useChartOptions({
    chartTitle: 'Bonding curve',
    titleX: 'Supply',
    titleY: 'Price',
  });

  const { data, error } = useSimulateContract({
    ...memezFactoryConfig,
    functionName: 'deploy',
    args: [name, symbol, parseEther((cap ?? 0).toString())],
    query: {
      enabled: !isValidationError,
    },
  });

  const { data: hash, writeContract, isPending } = useWriteContract();

  const {
    data: result,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  const transactionMemeCoinDeployedEvent = useMemo(
    () =>
      result
        ? parseEventLogs({
            abi: memezFactoryConfig.abi,
            logs: result.logs,
            eventName: 'MemeCoinDeployed',
          })[0]
        : null,
    [memezFactoryConfig, result],
  );

  const deployedMemeCoinAddress = useMemo(
    () => transactionMemeCoinDeployedEvent?.args?.memecoin ?? null,
    [transactionMemeCoinDeployedEvent],
  );

  const simulationError = useMemo(
    () => (error ? (error.cause as any)?.reason ?? error.message : null),
    [error],
  );

  const isAnyError = useMemo(
    () => isValidationError || !!simulationError,
    [isValidationError, simulationError],
  );

  useEffect(() => {
    if (!deployedMemeCoinAddress) return;
    router.push(`/coin?address=${deployedMemeCoinAddress}`);
  }, [deployedMemeCoinAddress, router]);

  return (
    <>
      <PageHead
        title="memez"
        subtitle="Create memecoin"
        description="Create your memecoin!"
      />
      <div className="flex flex-col gap-x3 items-center h-full">
        <Link
          href="/"
          passHref
          rel="noreferrer"
          className="disabled:shadow hover:font-bold hover:text-main-light focus:text-main-light active:text-main-shadow"
        >
          [go back]
        </Link>
        <div className="flex flex-row portrait:flex-col gap-x2 flex-1 w-full items-center justify-center landscape:overflow-hidden py-x4">
          <div className="flex flex-col gap-x2 landscape:flex-1 portrait:w-full max-w-[600px] landscape:max-h-full landscape:overflow-auto">
            <div
              className={`flex flex-col gap-x2 landscape:flex-1 portrait:w-full w-full p-x2 rounded-x1
                bg-main-gray border-2 cursor-pointer hover:border-main-accent
                ${step === CreationStep.TokenInfo ? 'border-main-accent' : step === CreationStep.Finish && !!tokenInfoError ? 'border-second-error' : 'border-main-gray'}
                text-body font-medium tracking-body
              `}
              onClick={() => setStep(CreationStep.TokenInfo)}
            >
              <h2 className="font-medium text-headline-2 leading-normal text-center">
                Token info
              </h2>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Name
                </span>
                {step === CreationStep.TokenInfo || !name ? (
                  <span className="font-medium">The name of your token</span>
                ) : (
                  <span className="font-bold">{name}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Symbol
                </span>
                {step === CreationStep.TokenInfo || !symbol ? (
                  <span className="font-medium">The symbol of your token</span>
                ) : (
                  <span className="font-bold">{symbol}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Description
                </span>
                {step === CreationStep.TokenInfo || !description ? (
                  <span className="font-medium">
                    The description of your token
                  </span>
                ) : (
                  <span className="font-bold">{description}</span>
                )}
              </div>
            </div>
            <div
              className={`flex flex-col gap-x2 landscape:flex-1 portrait:w-full w-full p-x2 rounded-x1
                bg-main-gray border-2 cursor-pointer hover:border-main-accent
                ${step === CreationStep.Tokenomics ? 'border-main-accent' : step === CreationStep.Finish && !!tokenomicsError ? 'border-second-error' : 'border-main-gray'}
                text-body font-medium tracking-body
              `}
              onClick={() => setStep(CreationStep.Tokenomics)}
            >
              <h2 className="font-medium text-headline-2 leading-normal text-center">
                Tokenomics
              </h2>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">Cap</span>
                {step === CreationStep.Tokenomics || !cap ? (
                  <span className="font-medium">The cap of your token</span>
                ) : (
                  <span className="font-bold">{cap} ETH</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Factor
                </span>
                {step === CreationStep.Tokenomics || !curveFactorN ? (
                  <span className="font-medium">
                    The factor of the bonding curve, given as a numerator and a
                    denominator
                  </span>
                ) : curveFactorD && Number(curveFactorD) !== 1 ? (
                  <div className="flex flex-col items-center font-bold">
                    <div>{curveFactorN}</div>
                    <hr className="w-full border border-main-accent" />
                    <div>{curveFactorD}</div>
                  </div>
                ) : (
                  <span className="font-bold">{curveFactorN}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Power
                </span>
                {step === CreationStep.Tokenomics || !curvePowerN ? (
                  <span className="font-medium">
                    The power of the bonding curve, given as a numerator and a
                    denominator
                  </span>
                ) : curvePowerD && Number(curvePowerD) !== 1 ? (
                  <div className="flex flex-col items-center font-bold">
                    <div>{curvePowerN}</div>
                    <hr className="w-full border border-main-accent" />
                    <div>{curvePowerD}</div>
                  </div>
                ) : (
                  <span className="font-bold">{curvePowerN}</span>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Price formula
                </span>
                {step === CreationStep.Tokenomics || !!tokenomicsError ? (
                  <div className="flex flex-row gap-x1 shrink-0 items-center font-medium">
                    <div className="flex flex-col items-center">
                      <div>F_N</div>
                      <hr className="w-full border border-main-accent" />
                      <div>F_D</div>
                    </div>
                    <div>*</div>
                    <div>supply ^</div>
                    <div className="flex flex-col items-center">
                      <div>P_N</div>
                      <hr className="w-full border border-main-accent" />
                      <div>P_D</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row gap-x1 shrink-0 items-center font-bold">
                    {curveFactorD ? (
                      <div className="flex flex-col items-center">
                        <div>{curveFactorN}</div>
                        <hr className="w-full border border-main-accent" />
                        <div>{curveFactorD}</div>
                      </div>
                    ) : (
                      <div>{curveFactorN}</div>
                    )}
                    <div>*</div>
                    <div>supply ^</div>
                    {curvePowerD ? (
                      <div className="flex flex-col items-center">
                        <div>{curvePowerN}</div>
                        <hr className="w-full border border-main-accent" />
                        <div>{curvePowerD}</div>
                      </div>
                    ) : (
                      <div>{curvePowerN}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-x1 lg:gap-x2 justify-between items-center">
                <span className="font-bold text-title leading-normal">
                  Max supply
                </span>
                {!!tokenomicsError ? (
                  <span className="font-medium">
                    The max supply of your token
                  </span>
                ) : (
                  <span className="font-bold">
                    {formatEther(maxSupply)} {symbol || ''}
                  </span>
                )}
              </div>
              <div className="flex flex-col w-full h-[512px] justify-center items-stretch">
                {chartData ? (
                  <ApexChart
                    options={chartOptions}
                    series={[{ data: chartData }]}
                    type="area"
                    width="100%"
                    height="512"
                  />
                ) : (
                  <p className="text-center">
                    Not enough data to build bonding curve
                  </p>
                )}
              </div>
            </div>
            {isConfirmed && (
              <p className="text-second-success">Memecoin created!</p>
            )}
            {step === CreationStep.Finish && isAnyError && (
              <p className="text-second-error">
                {tokenInfoError
                  ? 'Token Info'
                  : tokenomicsError
                    ? 'Tokenomics'
                    : 'Execution'}{' '}
                Error: {tokenInfoError || tokenomicsError || simulationError}
              </p>
            )}
            <PrimaryButton
              className={
                step !== CreationStep.Finish ? 'absolute bottom-x4 z-10' : ''
              }
              disabled={
                isAnyError || !data?.request || isPending || isConfirming
              }
              onClick={() => writeContract(data!.request)}
            >
              {isPending || isConfirming
                ? 'Creating memecoin...'
                : 'Create memecoin'}
            </PrimaryButton>
          </div>
          {step !== CreationStep.Finish && (
            <div className="flex flex-col gap-x2 landscape:flex-1 portrait:w-full max-w-[600px] landscape:max-h-full landscape:overflow-auto">
              {step === CreationStep.TokenInfo && (
                <div className="flex flex-col gap-x2 w-full p-x2 rounded-x1 bg-main-gray">
                  <h2 className="font-medium text-headline-2 leading-normal text-center">
                    Token info
                  </h2>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-title leading-normal pl-x0.5"
                      htmlFor="name-input"
                    >
                      Name
                    </label>
                    <TextInput
                      id="name-input"
                      value={name}
                      placeholder="Name"
                      isError={!!nameError}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-title leading-normal pl-x0.5"
                      htmlFor="symbol-input"
                    >
                      Symbol
                    </label>
                    <TextInput
                      id="symbol-input"
                      value={symbol}
                      placeholder="Symbol"
                      isError={!!symbolError}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-title leading-normal pl-x0.5"
                      htmlFor="description-input"
                    >
                      Description
                    </label>
                    <TextInput
                      id="description-input"
                      value={description}
                      placeholder="Description"
                      isError={!!descriptionError}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  {!!tokenInfoError && (
                    <p className="text-second-error">Error: {tokenInfoError}</p>
                  )}
                </div>
              )}
              {step === CreationStep.Tokenomics && (
                <div className="flex flex-col gap-x2 w-full p-x2 rounded-x1 bg-main-gray">
                  <h2 className="font-medium text-headline-2 leading-normal text-center">
                    Tokenomics
                  </h2>
                  <div className="flex flex-col gap-x0.5 w-full">
                    <label
                      className="font-bold text-title leading-normal pl-x0.5"
                      htmlFor="cap-input"
                    >
                      Cap
                    </label>
                    <div className="flex flex-row gap-x1">
                      <TextInput
                        id="cap-input"
                        className="flex-1"
                        value={cap}
                        placeholder="Cap"
                        type="number"
                        step={1}
                        max={1000}
                        isError={!!capError}
                        onChange={(e) =>
                          setCap(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                      <span className="text-title font-extrabold self-center">
                        ETH
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-x1 justify-stretch items-center">
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title leading-normal pl-x0.5"
                        htmlFor="factor-n-input"
                      >
                        Factor Numerator
                      </label>
                      <TextInput
                        id="factor-n-input"
                        className="flex-1"
                        value={curveFactorN}
                        placeholder="Factor numerator"
                        type="number"
                        step={1}
                        min={0}
                        max={1000000000}
                        isError={!!curveFactorNError}
                        onChange={(e) =>
                          setCurveFactorN(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                    <div className="font-bold text-title leading-normal self-end py-[20px]">
                      /
                    </div>
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title leading-normal pl-x0.5"
                        htmlFor="factor-d-input"
                      >
                        Factor Denominator
                      </label>
                      <TextInput
                        id="factor-d-input"
                        className="flex-1"
                        value={curveFactorD}
                        placeholder="Factor denominator"
                        type="number"
                        step={1}
                        min={1}
                        max={1000000000}
                        isError={!!curveFactorDError}
                        onChange={(e) =>
                          setCurveFactorD(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-row gap-x1 justify-stretch items-center">
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title leading-normal pl-x0.5"
                        htmlFor="power-n-input"
                      >
                        Power Numerator
                      </label>
                      <TextInput
                        id="power-n-input"
                        className="flex-1"
                        value={curvePowerN}
                        placeholder="Power numerator"
                        type="number"
                        step={1}
                        min={0}
                        max={10}
                        isError={!!curvePowerNError}
                        onChange={(e) =>
                          setCurvePowerN(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                    <div className="font-bold text-title leading-normal self-end py-[20px]">
                      /
                    </div>
                    <div className="flex flex-col gap-x0.5 w-full">
                      <label
                        className="font-bold text-title leading-normal pl-x0.5"
                        htmlFor="power-d-input"
                      >
                        Power Denominator
                      </label>
                      <TextInput
                        id="power-d-input"
                        className="flex-1"
                        value={curvePowerD}
                        placeholder="Power denominator"
                        type="number"
                        step={1}
                        min={1}
                        max={10}
                        isError={!!curvePowerDError}
                        onChange={(e) =>
                          setCurvePowerD(
                            e.target.value
                              .toString()
                              .replaceAll(/[^0-9.,]/g, ''),
                          )
                        }
                      />
                    </div>
                  </div>
                  {!!tokenomicsError && (
                    <p className="text-second-error">
                      Error: {tokenomicsError}
                    </p>
                  )}
                </div>
              )}
              <SecondaryButton onClick={() => setStep((step) => step + 1)}>
                {step === CreationStep.Finish - 1 ? 'Finish' : 'Next'}
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Create;
