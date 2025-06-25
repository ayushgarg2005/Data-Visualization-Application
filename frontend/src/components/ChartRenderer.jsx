





// import React, { useEffect, useState } from "react";
// import Plot from "react-plotly.js";

// const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00C49F", "#FFBB28"];

// const ChartRenderer = ({ chart, data }) => {
//   const [isChartReady, setIsChartReady] = useState(false);

//   useEffect(() => {
//     setIsChartReady(false);
//     const timeout = setTimeout(() => {
//       setIsChartReady(true);
//     }, 150);
//     return () => clearTimeout(timeout);
//   }, [chart, data]);

//   if (!chart || !data || data.length === 0)
//     return <p className="text-red-500">⚠️ No chart or data available.</p>;
//   if (!chart.x)
//     return <p className="text-red-500">⚠️ Missing x-axis value.</p>;
//   if (!chart.y && !["sunburst", "heatmap", "histogram"].includes(chart.type.toLowerCase()))
//     return <p className="text-red-500">⚠️ Missing y-axis value.</p>;

//   const x = chart.x;
//   const y = chart.y;

//   const filteredData = data
//   .filter((row) => {
//     const xVal = row[x];
//     const yVal = row[y];
//     return (
//       xVal !== null &&
//       xVal !== undefined &&
//       (chart.type.toLowerCase() === "histogram"
//         ? !isNaN(Number(xVal))
//         : y === undefined || (yVal !== null && yVal !== undefined && !isNaN(Number(yVal))))
//     );
//   })
//   .map((row) => ({
//     [x]: chart.type.toLowerCase() === "histogram" ? Number(row[x]) : row[x],
//     [y]: y ? Number(row[y]) : undefined,
//   }));


//   if (filteredData.length === 0)
//     return <p className="text-red-500">⚠️ No valid data points to plot.</p>;

//   const layout = {
//     autosize: true,
//     height: 400,
//     title: chart.title || chart.type,
//     margin: { t: 40, l: 40, r: 30, b: 40 },
//     paper_bgcolor: "#f9fafb",
//     plot_bgcolor: "#ffffff",
//     font: { family: "Inter, sans-serif", size: 12 },
//   };

//   if (!isChartReady) {
//     return (
//       <div className="flex items-center justify-center min-h-[420px] text-gray-500 italic">
//         📊 Preparing chart...
//       </div>
//     );
//   }

//   const renderPlot = (plotData) => (
//     <div className="min-h-[420px] w-full">
//       <Plot
//         data={plotData}
//         layout={layout}
//         useResizeHandler={true}
//         style={{ width: "100%", height: "100%" }}
//         config={{ responsive: true }}
//       />
//     </div>
//   );

//   try {
//     switch (chart.type.toLowerCase()) {
//       case "bar":
//         return renderPlot([
//           {
//             x: filteredData.map((d) => d[x]),
//             y: filteredData.map((d) => d[y]),
//             type: "bar",
//             marker: { color: COLORS[0] },
//           },
//         ]);

//       case "line":
//         return renderPlot([
//           {
//             x: filteredData.map((d) => d[x]),
//             y: filteredData.map((d) => d[y]),
//             type: "scatter",
//             mode: "lines+markers",
//             line: { color: COLORS[0] },
//           },
//         ]);

//       case "scatter":
//         return renderPlot([
//           {
//             x: filteredData.map((d) => d[x]),
//             y: filteredData.map((d) => d[y]),
//             type: "scatter",
//             mode: "markers",
//             marker: { color: COLORS[0], size: 8 },
//           },
//         ]);

//       case "pie":
//         return renderPlot([
//           {
//             labels: filteredData.map((d) => d[x]),
//             values: filteredData.map((d) => d[y]),
//             type: "pie",
//             marker: { colors: COLORS },
//           },
//         ]);

//       case "box":
//       case "boxplot":
//         return renderPlot([
//           {
//             y: filteredData.map((d) => d[y]),
//             type: "box",
//             name: y,
//             marker: { color: COLORS[0] },
//             boxpoints: "all",
//           },
//         ]);

//       case "histogram":
//         return renderPlot([
//           {
//             x: filteredData.map((d) => d[x]),
//             type: "histogram",
//             marker: { color: COLORS[0] },
//           },
//         ]);

//       case "heatmap":
//         return renderPlot([
//           {
//             z: [filteredData.map((d) => d[y])],
//             x: filteredData.map((d) => d[x]),
//             type: "heatmap",
//             colorscale: "Viridis",
//           },
//         ]);

//       case "sunburst":
//         return renderPlot([
//           {
//             type: "sunburst",
//             labels: filteredData.map((d) => d[x]),
//             parents: filteredData.map(() => ""),
//             values: filteredData.map((d) => d[y]),
//             textinfo: "label+value",
//             marker: { colors: COLORS },
//           },
//         ]);

//       default:
//         return (
//           <p className="text-yellow-500">
//             ⚠️ Chart type "<strong>{chart.type}</strong>" is not supported yet.
//           </p>
//         );
//     }
//   } catch (err) {
//     console.error("Chart rendering error:", err);
//     return <p className="text-red-500">❌ Failed to render chart. Please check the data.</p>;
//   }
// };

// export default ChartRenderer;



import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00C49F", "#FFBB28"];

const ChartRenderer = ({ chart, data }) => {
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    setIsChartReady(false);
    const timeout = setTimeout(() => setIsChartReady(true), 150);
    return () => clearTimeout(timeout);
  }, [chart, data]);

  if (!chart || !data || data.length === 0)
    return <p className="text-red-500">⚠️ No chart or data available.</p>;

  if (!chart.x)
    return <p className="text-red-500">⚠️ Missing x-axis value.</p>;

  const chartType = chart.type?.toLowerCase() || "";
  const needsY = !["sunburst", "heatmap", "histogram", "treemap", "radar", "donut", "timeline", "map"].includes(chartType);

  if (!chart.y && needsY)
    return <p className="text-red-500">⚠️ Missing y-axis value.</p>;

  const x = chart.x;
  const y = chart.y;

  const filteredData = data
    .filter(row => {
      const xVal = row[x];
      const yVal = row[y];

      if (chartType === "histogram")
        return xVal != null && !isNaN(Number(xVal));

      if (["scatter", "line", "bar", "bubble", "area", "density", "dual axis"].includes(chartType))
        return xVal != null && yVal != null && !isNaN(Number(yVal));

      return xVal != null;
    })
    .map(row => ({
      ...row,
      [x]: chartType === "histogram" ? Number(row[x]) : row[x],
      [y]: y && !["sunburst", "treemap", "donut", "radar", "map"].includes(chartType)
        ? Number(row[y])
        : row[y],
    }));

  if (filteredData.length === 0)
    return <p className="text-red-500">⚠️ No valid data points to plot.</p>;

  const baseLayout = {
    autosize: true,
    height: 400,
    title: chart.title || chart.type,
    margin: { t: 40, l: 40, r: 30, b: 40 },
    paper_bgcolor: "#f9fafb",
    plot_bgcolor: "#ffffff",
    font: { family: "Inter, sans-serif", size: 12 },
  };

  const renderPlot = (plotData, customLayout = {}) => (
    <div className="min-h-[420px] w-full">
      <Plot
        data={plotData}
        layout={{ ...baseLayout, ...customLayout }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
        config={{ responsive: true }}
      />
    </div>
  );

  try {
    switch (chartType) {
      case "bar":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "bar",
            marker: { color: COLORS[0] },
          }
        ]);

      case "line":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "scatter",
            mode: "lines",
            line: { color: COLORS[0] },
          }
        ]);

      case "line with markers":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "scatter",
            mode: "lines+markers",
            marker: { color: COLORS[0] },
          }
        ]);

      case "area":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "scatter",
            fill: "tozeroy",
            mode: "none",
            fillcolor: COLORS[0],
          }
        ]);

      case "scatter":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "scatter",
            mode: "markers",
            marker: { color: COLORS[0], size: 8 },
          }
        ]);

      case "bubble":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            text: filteredData.map(d => d[x]),
            mode: "markers",
            marker: {
              size: filteredData.map(d => d.size || 20),
              color: COLORS[1],
              opacity: 0.6,
            }
          }
        ]);

      case "histogram":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            type: "histogram",
            marker: { color: COLORS[0] },
          }
        ]);

      case "pie":
      case "donut":
        return renderPlot([
          {
            labels: filteredData.map(d => d[x]),
            values: filteredData.map(d => d[y]),
            type: "pie",
            hole: chartType === "donut" ? 0.4 : 0,
            marker: { colors: COLORS },
          }
        ]);

      case "box":
      case "boxplot":
        return renderPlot([
          {
            y: filteredData.map(d => d[y]),
            type: "box",
            boxpoints: "all",
            marker: { color: COLORS[0] },
          }
        ]);

      case "violin":
        return renderPlot([
          {
            y: filteredData.map(d => d[y]),
            type: "violin",
            box: { visible: true },
            meanline: { visible: true },
            marker: { color: COLORS[0] },
          }
        ]);

      case "heatmap":
        return renderPlot([
          {
            z: [filteredData.map(d => d[y])],
            x: filteredData.map(d => d[x]),
            type: "heatmap",
            colorscale: "Viridis",
          }
        ]);

      case "waterfall":
        return renderPlot([
          {
            type: "waterfall",
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            measure: filteredData.map(() => "relative"),
            connector: { line: { color: "gray" } },
          }
        ]);

      case "sunburst":
        return renderPlot([
          {
            type: "sunburst",
            labels: filteredData.map(d => d[x]),
            parents: filteredData.map(() => ""),
            values: filteredData.map(d => d[y]),
            textinfo: "label+value",
            marker: { colors: COLORS },
          }
        ]);

      case "treemap":
        return renderPlot([
          {
            type: "treemap",
            labels: filteredData.map(d => d[x]),
            parents: filteredData.map(() => ""),
            values: filteredData.map(d => d[y]),
            textinfo: "label+value",
            marker: { colors: COLORS },
          }
        ]);

      case "radar":
        return renderPlot([
          {
            type: "scatterpolar",
            r: filteredData.map(d => d[y]),
            theta: filteredData.map(d => d[x]),
            fill: "toself",
            marker: { color: COLORS[0] },
          }
        ]);

      case "timeline":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            type: "scatter",
            mode: "lines+markers",
            line: { color: COLORS[0] },
          }
        ]);

      case "dual axis":
        return renderPlot([
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[y]),
            name: y,
            yaxis: "y1",
            type: "scatter",
            mode: "lines+markers",
            marker: { color: COLORS[0] },
          },
          {
            x: filteredData.map(d => d[x]),
            y: filteredData.map(d => d[chart.y2]),
            name: chart.y2,
            yaxis: "y2",
            type: "scatter",
            mode: "lines",
            marker: { color: COLORS[1] },
          }
        ], {
          yaxis: { title: chart.y },
          yaxis2: {
            title: chart.y2,
            overlaying: "y",
            side: "right"
          }
        });

      case "map":
        return renderPlot([
          {
            type: "choropleth",
            locations: filteredData.map(d => d[x]),
            z: filteredData.map(d => d[y]),
            locationmode: "country names",
            colorscale: "Blues",
            marker: { line: { color: "gray" } },
          }
        ]);

      default:
        return (
          <p className="text-yellow-500">
            ⚠️ Chart type "<strong>{chart.type}</strong>" is not supported yet.
          </p>
        );
    }
  } catch (err) {
    console.error("Chart rendering error:", err);
    return <p className="text-red-500">❌ Failed to render chart. Please check the data.</p>;
  }
};

export default ChartRenderer;
