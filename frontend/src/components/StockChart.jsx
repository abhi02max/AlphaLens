import { useRef } from 'react'
import { Chart as ChartJS, registerables } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(...registerables)

export default function StockChart({ data, loading }) {
  const chartRef = useRef(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-dark-400">
        <div className="text-center">
          <div className="text-3xl mb-2">📈</div>
          <p className="text-sm">No chart data available</p>
        </div>
      </div>
    )
  }

  const dates = data.map(d => {
    if (d.date instanceof Date) return d.date.toLocaleDateString()
    const dt = new Date(d.date)
    return isNaN(dt.getTime()) ? d.date : dt.toLocaleDateString()
  })

  const isCandlestick = data.some(d => d.open != null && d.high != null && d.low != null && d.close != null && d.open !== d.close)

  if (isCandlestick) {
    const barData = data.map(d => ({
      x: new Date(d.date),
      o: d.open,
      h: d.high,
      l: d.low,
      c: d.close,
    }))

    const colors = barData.map(d => d.c >= d.o ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)')
    const borderColors = barData.map(d => d.c >= d.o ? 'rgb(34,197,94)' : 'rgb(239,68,68)')
    const wickColors = barData.map(d => d.c >= d.o ? 'rgb(34,197,94)' : 'rgb(239,68,68)')

    const chartData = {
      labels: dates,
      datasets: [
        {
          label: 'OHLC',
          data: barData.map(d => ({
            x: d.x,
            o: d.o,
            h: d.h,
            l: d.l,
            c: d.c,
          })),
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10, color: '#94a3b8' } },
        y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } },
      },
      elements: { point: { radius: 0 } },
    }

    const candlestickPlugin = {
      id: 'candlestick',
      beforeDraw(chart) {
        const ctx = chart.ctx
        const meta = chart.getDatasetMeta(0)
        const data = chart.data.datasets[0].data
        const yScale = chart.scales.y

        meta.data.forEach((bar, i) => {
          const d = data[i]
          if (!d) return
          const x = bar.x
          const isUp = d.c >= d.o
          const color = isUp ? 'rgb(34,197,94)' : 'rgb(239,68,68)'

          const yHigh = yScale.getPixelForValue(d.h)
          const yLow = yScale.getPixelForValue(d.l)
          const yOpen = yScale.getPixelForValue(d.o)
          const yClose = yScale.getPixelForValue(d.c)

          const barWidth = bar.width * 0.4

          ctx.save()
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x, yHigh)
          ctx.lineTo(x, yLow)
          ctx.stroke()

          ctx.fillStyle = color
          const bodyY = Math.min(yOpen, yClose)
          const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1)
          ctx.fillRect(x - barWidth / 2, bodyY, barWidth, bodyHeight)
          ctx.restore()
        })
      },
    }

    return (
      <div className="h-[300px]">
        <Chart ref={chartRef} type="bar" data={chartData} options={options} plugins={[candlestickPlugin]} />
      </div>
    )
  }

  // Line chart fallback
  const prices = data.map(d => d.close || d.price || 0)
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Price',
        data: prices,
        borderColor: 'rgb(14,165,233)',
        backgroundColor: 'rgba(14,165,233,0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, color: '#94a3b8' } },
      y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94a3b8' } },
    },
    elements: { point: { radius: 0 } },
  }

  return (
    <div className="h-[300px]">
      <Chart ref={chartRef} type="line" data={chartData} options={options} />
    </div>
  )
}

