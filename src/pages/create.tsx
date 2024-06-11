import React, { useState, useMemo, useEffect } from 'react';
import PageHead from '../components/PageHead';
import Link from 'next/link';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { useMemezFactoryConfig } from '../hooks';
import {
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { parseEther, parseEventLogs } from 'viem';
import { useRouter } from 'next/router';

export function Create() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [cap, setCap] = useState<string | number>(10);

  const memezFactoryConfig = useMemezFactoryConfig();

  const nameError = useMemo(
    () => (name.length < 1 ? 'Name is too short!' : null),
    [name],
  );
  const symbolError = useMemo(
    () => (symbol.length < 1 ? 'Symbol is too short!' : null),
    [symbol],
  );
  const capError = useMemo(
    () => (!cap || Number(cap) < 1 ? 'Invalid cap!' : null),
    [cap],
  );

  const isValidationError = useMemo(
    () => !!nameError || !!symbolError || !!capError,
    [nameError, symbolError, capError],
  );

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
          <TextInput
            value={name}
            placeholder="Name"
            isError={!!nameError}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            value={symbol}
            placeholder="Symbol"
            isError={!!symbolError}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <TextInput
            value={cap}
            placeholder="Cap"
            type="number"
            step={1}
            max={1000}
            isError={!!capError}
            onChange={(e) =>
              setCap(e.target.value.toString().replaceAll(/[^0-9.,]/g, ''))
            }
          />
          <Button
            disabled={isAnyError || !data?.request || isPending || isConfirming}
            onClick={() => writeContract(data!.request)}
          >
            {isPending || isConfirming
              ? 'Creating memecoin...'
              : 'Create memecoin'}
          </Button>
          {isConfirmed && (
            <p className="text-text-success">Memecoin created!</p>
          )}
          {isAnyError && (
            <p className="text-text-error">
              Error: {nameError || symbolError || capError || simulationError}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default Create;
