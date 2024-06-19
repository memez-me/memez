'use client';

import {
  createChart,
  ChartOptions,
  CandlestickSeriesPartialOptions,
  CandlestickData,
  DeepPartial,
} from 'lightweight-charts';
import React, { useEffect, useMemo, useRef } from 'react';
import _ from 'lodash';

type LightweightChartProps = {
  data: CandlestickData[];
  chartOptions?: DeepPartial<ChartOptions>;
  candlestickOptions?: CandlestickSeriesPartialOptions;
  className?: string;
};

function LightweightChart({
  data,
  chartOptions: overriddenChartOptions,
  candlestickOptions: overriddenCandlestickOptions,
  className,
}: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  const chartOptions = useMemo<DeepPartial<ChartOptions>>(
    () =>
      _.defaultsDeep({}, overriddenChartOptions, {
        layout: {
          textColor: '#92FFCB',
          background: { type: 'solid', color: 'transparent' },
        },
        timeScale: {
          borderColor: 'transparent',
        },
        rightPriceScale: {
          borderColor: 'transparent',
        },
        grid: {
          horzLines: {
            color: '#20573D',
          },
          vertLines: {
            color: '#20573D',
          },
        },
        crosshair: {
          horzLine: {
            color: '#92FFCB',
          },
          vertLine: {
            color: '#92FFCB',
          },
        },
      } as DeepPartial<ChartOptions>),
    [overriddenChartOptions],
  );

  const candlestickOptions = useMemo<CandlestickSeriesPartialOptions>(
    () =>
      _.defaultsDeep({}, overriddenCandlestickOptions, {
        upColor: '#00FF85',
        downColor: '#FF6B4A',
        borderVisible: false,
        wickUpColor: '#00FF85',
        wickDownColor: '#FF6B4A',
      } as CandlestickSeriesPartialOptions),
    [overriddenCandlestickOptions],
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chart.timeScale().fitContent();

    const newSeries = chart.addCandlestickSeries(candlestickOptions);
    newSeries.setData(data);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      chart.remove();
    };
  }, [data, chartOptions, candlestickOptions]);

  return <div className={className} ref={chartContainerRef} />;
}

export default LightweightChart;
