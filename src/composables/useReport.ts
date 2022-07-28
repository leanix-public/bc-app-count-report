import '@leanix/reporting'
import { ref, unref, computed } from 'vue'
import { BusinessCapability } from '../types'
import debounce from 'lodash.debounce'

const isInitialized = ref(false)
const dataset = ref<BusinessCapability[]>([])

const setDataset = debounce((newDataset: BusinessCapability[]) => {
  dataset.value = newDataset
}, 1000)

// @ts-ignore
const getCurrentSetup = (): Promise<lxr.ReportSetup> => lx?.currentSetup ? Promise.resolve(lx.currentSetup) : lx.init()

const loadLeanIXStyleSheet = async () => {
  const { settings: { baseUrl } } = await (await getCurrentSetup())
  // https://eu-6.leanix.net/customReportDev/styles.2cef2442e90e6cfb.css
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/preload
  const head = document.getElementsByTagName('HEAD')[0]
  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.as = 'style'
  preloadLink.href = `${baseUrl}/styles.2cef2442e90e6cfb.css`
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `${baseUrl}/styles.2cef2442e90e6cfb.css`
  head.appendChild(preloadLink)
  head.appendChild(link)
}

const getReportConfiguration = (): lxr.ReportConfiguration => ({
  allowTableView: false,
  facets: [
    {
      key: 'first',
      fixedFactSheetType: 'BusinessCapability',
      attributes: ['displayName', 'relBusinessCapabilityToApplication{totalCount}'],
      defaultFilters: [
        { facetKey: 'hierarchyLevel', keys: ['1'] }
      ],
      callback: data => {
        const _dataset = data
          .map(({ id, type, displayName, relBusinessCapabilityToApplication: { totalCount: relatedApplicationCount } }) => ({ id, type, displayName, relatedApplicationCount }))
          .sort((A, B) => {
            return A.relatedApplicationCount > B.relatedApplicationCount
              ? -1
              : A.relatedApplicationCount < B.relatedApplicationCount
                ? 1
                : A.displayName > B.displayName
                  ? 1
                  : A.displayName < B.displayName
                    ? -1
                    : 0
          })
        setDataset(_dataset)
      }
    }
  ]
})

const initReport = async () => {
  if (unref(isInitialized)) return
  try {
    loadLeanIXStyleSheet()
    await lx.init()
    const reportConfig = getReportConfiguration()
    await lx.ready(reportConfig)
  } finally {
    isInitialized.value = true
  }
}


const chartOptions = computed(() => {
  const barWidth = 30 // bar width in pixels
  const height = Math.max(unref(dataset).length * barWidth, 100)
  return {
    chart: {
      type: 'bar',
      height,
      width: '80%',
      toolbar: {
        show: false
      }
    },
    colors: ['#1766EE'],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'middle',
      style: {
        fontFamily: 'Axiforma',
        fontWeight: 800,
        fontSize: 9,
        colors: ['#2a303d']
      },
      background: {
        enabled: true,
        dropShadow: {
          enabled: true
        }
      }
    },
    grid: {
      show: false,
      padding: {
        right: 100,
        left: 100
      }
    },
    xaxis: {
      categories: unref(dataset).map(({ displayName }) => displayName),
      axisTicks: {
        show: false
      },
      axisBorder: {
        show: false
      },
      labels: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: true,
        align: 'left',
        offsetX: 0,
        style: {
          fontFamily: 'Axiforma',
          fontSize: 11,
          color: '#666666'
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      showForSingleSeries: true,
      fontWeight: 800,
      fontFamily: 'Axiforma'
    },
    tooltip: {
      enabled: true,
      style: {
        fontFamily: 'Axiforma'
      },
      y: {
        formatter: (value: number) => value
      }
    }
  }
})

const series = computed(() => {
  return [
    {
      name: 'Related Applications Count',
      data: unref(dataset).map(({ relatedApplicationCount }) => relatedApplicationCount)
    }
  ]
})

const useReport = () => {
  return {
    initReport,
    dataset: computed(() => unref(dataset)),
    chartOptions,
    series
  }
}

export default useReport
