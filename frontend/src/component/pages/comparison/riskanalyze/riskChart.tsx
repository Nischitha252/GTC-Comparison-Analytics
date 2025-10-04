import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  // Customization,
} from "recharts";
import "./riskChart.css";

interface PieData {
  name: string;
  value: number;
}

interface BarData {
  name: string;
  value: number; 
  fill: string; 
}

interface ComparisonProps {
  blueCount: number;
  redCount: number;
  barData: BarData[];
  riskCount: any;
}

const COLORS = ["#3366ff", "#ff0011"];

const RiskChart: React.FC<ComparisonProps> = ({
  blueCount,
  redCount,
  riskCount,
}) => {
  const pieData: PieData[] = [
    { name: "Blue Clauses", value: blueCount },
    { name: "Red Clauses", value: redCount },
  ];

 
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul
        style={{
          display: "flex",
          justifyContent: "center",
          listStyle: "none",
          padding: 0,
          marginTop: "10px",
        }}
      >
        {payload.map((entry: any, index: number) => (
          <li
            key={`item-${index}`}
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: "20px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: entry.color,
                marginRight: "8px",
              }}
            ></div>
            <span>
              {entry.value}: {index === 0 ? blueCount : redCount}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const COLORSS = {
    blue: "#3366FF",
    red: "#ff0011",
    orange: "#FFA200",
    green: "#51A34B",
  };


  const barData = [
    {
      category: "Blue Clauses",
      Total: riskCount?.TotalBlueClausesCount,
      Agreed: riskCount?.AgreedBlueClausesCount,
      fill: COLORSS.blue,
      labelTotal: `Total : ${riskCount?.TotalBlueClausesCount || 0}`,
      labelAgreed: `Agreed : ${riskCount?.AgreedBlueClausesCount || 0}`,
    },
    {
      category: "Red Clauses",
      Total: riskCount?.TotalRedClausesCount,
      Agreed: riskCount?.AgreedRedClausesCount,
      fill: COLORSS.red,
      labelTotal: `Total : ${riskCount?.TotalRedClausesCount || 0}`,
      labelAgreed: `Agreed : ${riskCount?.AgreedRedClausesCount || 0}`,
    },
    {
      category: "OverAll Clauses",
      Total: riskCount?.TotalClauseCount,
      Agreed: riskCount?.AgreedClauseCount,
      fill: COLORSS.green,
      labelTotal: `Total : ${riskCount?.TotalClauseCount || 0}`,
      labelAgreed: `Agreed : ${riskCount?.AgreedClauseCount || 0}`,
    },
  ];

  return (
    <>
      <h2 style={{ marginTop: "10px", marginBottom: "10px" }}>
        Clause Summary Chart
      </h2>
      <div className="chart-container">
        {/* Pie Chart Section */}
        <div className="pie-chart">
          <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>
            Clause Distribution
          </h3>
          <PieChart width={400} height={400}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              content={renderCustomLegend}
            />
          </PieChart>
        </div>

        {/* Bar Chart Section */}
        <div className="bar-charts">
          <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>
            Clause Comparisons
          </h3>
          <ResponsiveContainer width="90%" height={400}>
            <BarChart
              data={barData}
              margin={{ top: 30, right: 20, left: 20, bottom: 50 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="category"
                tick={{ fontSize: 14, fontWeight: "bold" }}
                interval={0}
                tickLine={false}
              />

              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />

              <Bar dataKey="Total" fill={COLORSS.blue} barSize={70}>
                <LabelList
                  dataKey="labelTotal"
                  position="top"
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    fill: "#333",
                  }}
                />
              </Bar>

              {/* Bars for Agreed */}
              <Bar dataKey="Agreed" fill={COLORSS.red} barSize={70}>
                <LabelList
                  dataKey="labelAgreed"
                  position="top"
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    fill: "#333",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default RiskChart;
