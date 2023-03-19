import { useRenderData } from "streamlit-component-lib-react-hooks"
import {
  createChart,
  IChartApi,
} from "lightweight-charts"
import React, { useRef, useEffect } from "react"

const LightweightChartsMultiplePanes: React.VFC = () => {

  // returns the renderData passed from Python
  // { args: object, disabled: boolean, theme: object }
  const renderData = useRenderData()
  const chartsData = renderData.args["charts"]

  const chartsContainerRef = useRef<HTMLDivElement>(null)
  const chartElRefs = Array(chartsData.length).fill(useRef<HTMLDivElement>(null))
  const chartRefs = useRef<IChartApi[]>([])

    useEffect(() => {
      if (chartElRefs.find((ref) => !ref.current)) return;

      chartElRefs.forEach((ref, i) => {
        const chart = chartRefs.current[i] = createChart(
          ref.current as HTMLDivElement,{
            height: 300,
            width: chartElRefs[i].current.clientWidth,
            ...chartsData[i].chart,
          }
        );
        
        chart.timeScale().fitContent();

        for (const series of chartsData[i].series){
          
          let newSeries
          switch(series.type) {
            case 'Area':
              newSeries = chart.addAreaSeries(series.options)
              break
            case 'Bar':
              newSeries = chart.addBarSeries(series.options )
              break
            case 'Baseline':
              newSeries = chart.addBaselineSeries(series.options)
              break
            case 'Candlestick':
              newSeries = chart.addCandlestickSeries(series.options)
              break
            case 'Histogram':
              newSeries = chart.addHistogramSeries(series.options)
              break
            case 'Line':
              newSeries = chart.addLineSeries(series.options)
              break
            default:
                return
          }

          if(series.priceScale)
            chart.priceScale(series.options.priceScaleId || '').applyOptions(series.priceScale)

          newSeries.setData(series.data)
        }
        
      })
  
      const charts = chartRefs.current.map((c) => c as IChartApi);
      
      if(chartsData.length > 1){ // sync charts
        charts.forEach((chart) => {
          if (!chart) return;

          chart.timeScale().subscribeVisibleTimeRangeChange((e) => {
            charts
              .filter((c) => c !== chart)
              .forEach((c) => {
                c.timeScale().applyOptions({
                  rightOffset: chart.timeScale().scrollPosition()
                })
              })
          })
          chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (range) {
              charts
                .filter((c) => c !== chart)
                .forEach((c) => {
                  c.timeScale().setVisibleLogicalRange({
                    from: range?.from,
                    to: range?.to
                  })
                })
            }
          })
        })
      }

      // const handleResize = () => {
      //   chart.applyOptions({ width: chartsContainerRef?.current?.clientWidth })
      // }
      return () => { // required because how useEffect() works
        charts.forEach((chart) => {
          chart.remove()
        })
      }

    }, [ chartsData, chartElRefs, chartRefs]);
  
    return (
      <div ref={chartsContainerRef}>
        {chartElRefs.map((ref, i) => (
          <div
            ref={ref}
            id={`lightweight-charts-${i}`}
            key={`lightweight-charts-${i}`}
          />
        ))}
      </div>
    );

}

export default LightweightChartsMultiplePanes
