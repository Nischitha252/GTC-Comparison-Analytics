// commercial.tsx
import React, { useState } from "react";
import "./riskAnalyzer.css";
import entities from "component/content/content.json";
import DownloadIcon from "assets/icon/ip-download-icon";
import LeftArrowIcon from "assets/icon/ip-leftArrow-icon";
import { BLOB_STORAGE_URL } from "config";
import { CSVLink } from "react-csv";
import RiskSummary from "./riskanalyze/riskSummary";
import RiskChart from "./riskanalyze/riskChart";

interface ComparisonProps {
  onBackClick: () => void;
  setRiskAnalyzerSelected: (value: boolean) => void;
  riskCount: any;
  riskSummary: any;
  blobName: string;
}

const RiskAnalyzerComparison: React.FC<ComparisonProps> = ({
  onBackClick,
  setRiskAnalyzerSelected,
  riskCount,
  riskSummary,
  blobName,
}) => {
  const headers = [
    { label: "Section", key: "section" },
    { label: "Query", key: "query" },
    { label: "ABB policy", key: "abbpolicy" },
    { label: "Vendor policy", key: "vendorpolicy" },
    { label: "Score", key: "score" },
  ];

  const data = [
    {
      section: "Red clauses",
      Query:
        "Supplier-GTC has added clauses related to Software on Hardware and Title and Risk, while it is missing specific details on Packing and Security, Delivery Note, Delivery Completion, Installments, and Remedies compared to ABB-GTC.",
      abbpolicy:
        "Supplier-GTC is missing Packing and Security: The Hardware must be properly packed and secured to ensure it reaches its destination in good condition and without interference during transit.",
      vendorpolicy:
        "Supplier-GTC has added Software on Hardware: Any software or computer programs provided on the Hardware are treated as goods, not services. The Supplier must ensure no malicious software, viruses, or backdoors are included.",
      score: "60",
    },
    {
      section: "Blue clauses",
      Query:
        "Supplier-GTC has added a clause stating that the Supplier represents, warrants, and undertakes that the Hardware (in whole and in part) will meet the specified conditions.",
      abbpolicy:
        "Supplier-GTC is missing Installments: The Supplier must not deliver the Hardware in installments without the Customer’s prior written consent.",
      vendorpolicy:
        "Supplier-GTC has added a clause stating that the Supplier represents, warrants, and undertakes that the Hardware (in whole and in part) will meet the specified conditions",
      score: "60",
    },
  ];

  const COLORS = {
    blue: "#3366ff",
    red: "#ff0011",
    orange: "#FFA200",
    grey: "#51A34B",
  };

  // Updated Bar Data with Dynamic Names and Colors
  const barData = [
    {
      name: "Total Blue Clauses",
      value: riskCount?.TotalBlueClausesCount,
      fill: COLORS.blue,
    },
    {
      name: "Agreed Blue Clauses",
      value: riskCount?.AgreedBlueClausesCount,
      fill: COLORS.blue,
    },
    {
      name: "Total Red Clauses",
      value: riskCount?.TotalRedClausesCount,
      fill: COLORS.red,
    },
    {
      name: "Agreed Red Clauses",
      value: riskCount?.AgreedRedClausesCount,
      fill: COLORS.red,
    },
    {
      name: "Total Clauses",
      value: riskCount?.TotalClauseCount,
      fill: COLORS.grey,
    },
    {
      name: "Agreed Clauses",
      value: riskCount?.AgreedClauseCount,
      fill: COLORS.grey,
    },
  ];

  const handleDownloadClick = async () => {
    try {
      // Construct download URL and initiate download
      const blobUrl = `${BLOB_STORAGE_URL}/${blobName}`;

      const blobResponse = await fetch(blobUrl);
      // const blobResponse = await fetch(blobUrl, { mode: 'no-cors' });
      if (!blobResponse.ok) {
        throw new Error(`Failed to fetch file: ${blobResponse.statusText}`);
      }
      const fileBlob = await blobResponse.blob();

      const downloadLink = document.createElement("a");
      downloadLink.href = window.URL.createObjectURL(fileBlob);
      downloadLink.download = `ims_${new Date().toISOString()}.xlsx`;
      // downloadLink.download = blobName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error during download:", error);
      throw error; // Propagate error for external handling if needed
    }
  };

  return (
    <div className="riskTableBox">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "0",
        }}
      >
        <button
          className="riskBackButton"
          onClick={() => {
            onBackClick();
            setRiskAnalyzerSelected(false);
          }}
        >
          <LeftArrowIcon className="riskBackIcon" size="medium" />
          Back
        </button>
        <div>
          <div className="riskButtons">
            {/* <CSVLink
              data={data}
              headers={headers}
              style={{ textDecoration: "none" }}
              filename={"risk-analyzer-report.csv"}
            > */}
            <button
              className="riskDownloadButton"
              onClick={handleDownloadClick}
            >
              <DownloadIcon className="downloadBackIcon" size="medium" />
              Download
            </button>
            {/* </CSVLink> */}
          </div>
        </div>
      </div>

      <div>
        <h2>Risk Summary</h2>
        <RiskSummary
          AgreedClausePercentage={riskSummary?.AgreedClausePercentage}
          AgreedBlueClausesPercentage={riskSummary?.AgreedBlueClausesPercentage}
          AgreedRedClausePercentage={riskSummary?.AgreedRedClausePercentage}
          RiskPosition={riskSummary?.RiskPosition}
        />
      </div>
      <div>
        <RiskChart
          blueCount={riskCount?.AgreedBlueClausesCount}
          redCount={riskCount?.AgreedRedClausesCount}
          barData={barData}
          riskCount={riskCount}
        />
      </div>
      <h2 className="table-head">Non-Compliant Clauses Overview</h2>
      <div className="tableContainers">
        <div className="tableWrapper">
          <table className="table">
            <thead>
              <tr>
                <th className="sno">S.No.</th>
                <th className="entity">Not-inline Blue Clauses</th>
                <th className="differences">Not-inline Red Clauses</th>
              </tr>
            </thead>

            <tbody>
              {(() => {
                const blueClauses = riskCount?.DisagreedBlueClauses || [];
                const redClauses = riskCount?.DisagreedRedClauses || [];

                // Determine the maximum length between the two arrays
                const maxLength = Math.max(
                  blueClauses.length,
                  redClauses.length
                );

                // Generate rows based on the maximum length
                return Array.from({ length: maxLength }).map((_, index) => {
                  const blueData = blueClauses[index] || "";
                  const redData = redClauses[index] || "";

                  return (
                    <tr key={index}>
                      <td className="sno">{index + 1}</td>
                      <td className="entity">{blueData}</td>
                      <td className="differences">{redData}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalyzerComparison;
