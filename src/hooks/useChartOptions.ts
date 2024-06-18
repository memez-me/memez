import { ApexOptions } from 'apexcharts';

type UseChartOptionsParams = {
  chartTitle?: string;
  titleX?: string;
  titleY?: string;
  point?: {
    x: number;
    y: number;
    text: string;
  };
};

export const useChartOptions = ({
  chartTitle,
  titleX,
  titleY,
  point,
}: UseChartOptionsParams = {}) => {
  return {
    colors: ['#92FFCB'],
    title: chartTitle
      ? {
          text: chartTitle,
          align: 'center',
          style: {
            color: '#92FFCB',
          },
        }
      : undefined,
    chart: {
      foreColor: 'transparent',
      background: 'transparent',
      toolbar: {
        show: false,
      },
      parentHeightOffset: 0,
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: false,
        zoomedArea: {
          fill: {
            color: '#47514C',
            opacity: 0.5,
          },
          stroke: {
            color: '#00FF85',
            opacity: 0.4,
            width: 1,
          },
        },
      },
    },
    markers: {
      strokeColors: '#00FF85',
    },
    xaxis: {
      type: 'numeric',
      tickAmount: 10,
      axisTicks: {
        show: true,
        color: '#92FFCB',
      },
      axisBorder: {
        show: false,
      },
      crosshairs: {
        show: true,
        stroke: {
          color: '#00FF85',
          width: 1,
          dashArray: 0,
        },
      },
      tooltip: {
        enabled: false,
      },
      labels: {
        style: {
          colors: '#92FFCB',
        },
        formatter: function (value) {
          const fixed = Number(value)?.toFixed(3);
          if (Number(fixed) > 0) return Number.parseFloat(fixed).toString();
          const exp = Number(value)?.toExponential(3);
          return Number.parseFloat(exp).toString();
        },
      },
      title: titleX
        ? {
            text: titleX,
            offsetY: -15,
            style: {
              color: '#92FFCB',
            },
          }
        : undefined,
    },
    yaxis: {
      show: true,
      axisTicks: {
        show: true,
        color: '#92FFCB',
      },
      labels: {
        style: {
          colors: '#92FFCB',
        },
        formatter: function (value) {
          const fixed = Number(value)?.toFixed(3);
          if (Number(fixed) > 0) return Number.parseFloat(fixed).toString();
          const exp = Number(value)?.toExponential(3);
          return Number.parseFloat(exp).toString();
        },
      },
      title: titleY
        ? {
            text: titleY,
            offsetX: 5,
            style: {
              color: '#92FFCB',
            },
          }
        : undefined,
    },
    annotations: point
      ? {
          points: [
            {
              x: point.x,
              y: point.y,
              marker: {
                size: 4,
                fillColor: '#20573D',
                strokeColor: '#00FF85',
                radius: 2,
              },
              label: {
                borderColor: '#00FF85',
                offsetY: 0,
                style: {
                  color: '#000A05',
                  background: '#00FF85',
                },
                text: point.text,
              },
            },
          ],
        }
      : undefined,
    tooltip: {
      enabled: true,
      fillSeriesColor: true,
      x: {
        show: false,
      },
      marker: {
        show: false,
      },
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const [x, y] = w.config.series[seriesIndex].data[dataPointIndex];
        return `
        <div class="flex flex-col p-x0.5 bg-main-shadow">
          <p>${titleY ?? 'Y'}: ${y}</p>
          <p>${titleX ?? 'X'}: ${x}</p>
        </div>
      `;
      },
    },
    grid: {
      show: false,
    },
    dataLabels: {
      enabled: false,

      background: {
        enabled: false,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 6,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
      },
    },
    stroke: {
      width: [2, 2],
      curve: 'straight',
    },
  } as ApexOptions;
};
