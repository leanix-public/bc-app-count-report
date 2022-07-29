import '@leanix/reporting'
import { ref, unref, computed } from 'vue'
import { BusinessCapability } from '../types'
import AllBusinessCapabilities from '../graphql/AllBusinessCapabilities.gql'
import { print } from 'graphql'

// import debounce from 'lodash.debounce'

const isInitialized = ref(false)
const dataset = ref<BusinessCapability[]>([])

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

const fetchDatasetPage = async (after: null | string) => {
  const query = print(AllBusinessCapabilities)
  let endCursor = null
  const businessCapabilities: BusinessCapability[] = await lx.executeGraphQL(query, JSON.stringify({ after }))
    .then(({ allFactSheets: { edges, pageInfo } }) => {
      if (pageInfo.hasNextPage) endCursor = pageInfo.endCursor
      return edges
        .map(({ node }: any) => {
          const { id, type, displayName, level, relToParent, relBusinessCapabilityToApplication } = node
          const parentId = relToParent?.edges?.at(0)?.node?.factSheet?.id ?? null
          const relatedApplicationIds = new Set<string>(relBusinessCapabilityToApplication?.edges
            .map(({ node: { factSheet: { id } } }: any) => id as string))
          const businessCapability: BusinessCapability = {
            id,
            type,
            level,
            displayName,
            parentId,
            children: [],
            relatedApplicationIds,
            aggregatedApplicationCount: 0
          }
          return businessCapability
        })
    })
  return { endCursor, data: businessCapabilities }
}

const fetchDataset = async () => {
  const businessCapabilities: BusinessCapability[] = []
  let data: BusinessCapability[] = []
  let endCursor: string | null = null
  try {
    lx.showSpinner()
    do {
      ({ data, endCursor } = await fetchDatasetPage(endCursor))
      businessCapabilities.push(...data)
    } while (endCursor !== null)
  } finally {
    lx.hideSpinner()
  }

  const businessCapabilityIndex = businessCapabilities
    .reduce((accumulator: Record<string, BusinessCapability>, businessCapability) => {
      if (!accumulator[businessCapability.id]) accumulator[businessCapability.id] = businessCapability
      if (businessCapability.parentId !== null) {
        const parent = accumulator[businessCapability.parentId] ?? null
        if (parent === null) throw Error(`could not find parent id ${businessCapability.parentId}`)
        businessCapability.relatedApplicationIds.forEach(id => parent.relatedApplicationIds.add(id))
        parent.aggregatedApplicationCount = parent.relatedApplicationIds.size
      }
      return accumulator
    }, {})
  const businessCapabilitiesL1 = Object.values(businessCapabilityIndex)
    .filter(({ level }) => level === 1)
    .sort((A, B) => {
      return A.aggregatedApplicationCount > B.aggregatedApplicationCount
        ? -1
        : A.aggregatedApplicationCount < B.aggregatedApplicationCount
          ? 1
          : A.displayName > B.displayName
            ? 1
            : A.displayName < B.displayName
              ? -1
              : 0
    })
  dataset.value = businessCapabilitiesL1
}

const getReportConfiguration = (): lxr.ReportConfiguration => ({
  allowTableView: false
})

const initReport = async () => {
  if (unref(isInitialized)) return
  try {
    loadLeanIXStyleSheet()
    await lx.init()
    const reportConfig = getReportConfiguration()
    await lx.ready(reportConfig)
    fetchDataset()
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
      data: unref(dataset).map(({ aggregatedApplicationCount }) => aggregatedApplicationCount)
    }
  ]
})

const useReport = () => {
  return {
    initReport,
    dataset: computed(() => unref(dataset)),
    chartOptions,
    series,
    fetchDataset
  }
}

export default useReport
