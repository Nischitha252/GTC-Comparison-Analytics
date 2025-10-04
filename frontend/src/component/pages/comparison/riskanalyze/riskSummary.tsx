import React from "react";
import "./riskSummary.css";

interface ClauseCardProps {
  title: string;
  percentage: number;
  target: number;
  risk: string;
  riskColor: string;
}

interface RiskSummaryProps {
  AgreedClausePercentage: number;
  AgreedBlueClausesPercentage: number;
  AgreedRedClausePercentage: number;
  RiskPosition: string;
}

const ClauseCard: React.FC<ClauseCardProps> = ({
  title,
  percentage,
  target,
  risk,
  riskColor,
}) => {
  return (
    <div className="clause-card">
      <h2>{title}</h2>
      <p className="percentage" style={{ color: riskColor }}>
        {percentage}%
      </p>
      {/* <p>Target: {target}%</p> */}
      {/* <p className="risk" style={{ color: riskColor }}>
        {risk}
      </p> */}
    </div>
  );
};

const RiskSummary: React.FC<RiskSummaryProps> = ({
  AgreedClausePercentage,
  AgreedBlueClausesPercentage,
  AgreedRedClausePercentage,
  RiskPosition,
}) => {
  return (
    <>
      <div className="clause-container">
        <ClauseCard
          title="Blue Clauses Met"
          percentage={Math.ceil(AgreedBlueClausesPercentage)}
          target={95}
          risk="Low Risk"
          riskColor="#3366ff"
        />
        <ClauseCard
          title="Red Clauses Met"
          percentage={Math.ceil(AgreedRedClausePercentage)}
          target={90}
          risk="Medium Risk"
          riskColor="#ff0011"
        />
        <ClauseCard
          title="All Clauses Met"
          percentage={Math.ceil(AgreedClausePercentage)}
          target={85}
          risk="High Risk"
          riskColor="#ED5739"
        />
      </div>
      <h3 className="vendor-label">
        Vendor Position:
        <span style={{ color: "#ff0011", marginLeft: "4px" }}>
          {RiskPosition}
        </span>
      </h3>
    </>
  );
};

export default RiskSummary;
