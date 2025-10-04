// commercial.tsx
import React, { useState } from "react";
import "./riskAnalyzer.css";
import entities from "component/content/content.json";
import DownloadIcon from "assets/icon/ip-download-icon";
import LeftArrowIcon from "assets/icon/ip-leftArrow-icon";
import { BLOB_STORAGE_URL } from "config";
import { CSVLink } from "react-csv";

import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// type DataList = {
//   [entity: string]: {
//     similarities: string[];
//     additions: string[];
//     removals: string[];
//     Difference: string;
//   };
// };

interface ComparisonProps {
  onBackClick: () => void;
  // dataList: DataList;
  // blobName: string;
  // tokenCost: number;
  setRiskAnalyzerSelected: (value: boolean) => void;
}

const RiskAnalyzerComparison: React.FC<ComparisonProps> = ({
  onBackClick,
  // dataList,
  // blobName,
  // tokenCost,
  setRiskAnalyzerSelected,
}) => {
  const [selectedClauseType, setSelectedClauseType] = useState<
    "all" | "red" | "nonRed" | "risk"
  >("all");
  const [isErrorAnalyse, setIsErrorAnalyse] = useState<number>(0);
  const [isAnalyzeBoolean, setIsAnalyzeBoolean] = useState<boolean>(false);
  const dataGraph = [
    {
      name: "Metrics of clauses", // For Red Clauses
      RedClause1: 10, // First score for Red Clause
      RedClause2: 20, // Second score for Red Clause
      RedClause3: 30, // Third score for Red Clause
      BlueClause1: 15, // First score for Blue Clause
      BlueClause2: 25, // Second score for Blue Clause
      BlueClause3: 35, // Third score for Blue Clause
    },
  ];

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

  return (
    <div className="riskTableBox">
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
      <div className="riskButtons">
        <CSVLink
          data={data}
          headers={headers}
          style={{ textDecoration: "none" }}
          filename={"risk-analyzer-report.csv"}
        >
          <button className="downloadButton">
            <DownloadIcon className="downloadBackIcon" size="medium" />
            Download
          </button>
        </CSVLink>
      </div>

      <div className="tableContainer">
        <table className="table">
          <thead>
            <tr>
              <th className="sno">S.No.</th>
              <th className="entity">Section</th>
              <th className="differences">query</th>
              <th className="addition">ABB Policy</th>
              <th className="removals">Vendor Policy</th>
              <th className="similarities">Score(%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sno">1</td>
              <td className="entity">
                <strong>Intellectual Property</strong>
              </td>
              <td className="differences">
                1) Updated clauses regarding ownership of developed software.
              </td>
              <td className="addition">
                1) Added: Confidentiality agreement for all project-related
                information.
              </td>
              <td className="removals">
                1) Removed: Previous ambiguous IP ownership clauses.
              </td>
              <td className="similarities"> 10%</td>
            </tr>
            <tr>
              <td className="sno">2</td>
              <td className="entity">
                <strong>Payment Terms</strong>
              </td>
              <td className="differences">
                1) Changed payment schedule from monthly to milestone-based.
              </td>
              <td className="addition">
                1) Added: Late payment penalties and early payment discounts.
              </td>
              <td className="removals">
                1) Removed: Fixed monthly payment structure.
              </td>
              <td className="similarities"> 15%</td>
            </tr>
            <tr>
              <td className="sno">3</td>
              <td className="entity">
                <strong>Liability</strong>
              </td>
              <td className="differences">
                1) Increased liability cap for data breaches.
              </td>
              <td className="addition">
                1) Added: Specific indemnification for third-party IP claims.
              </td>
              <td className="removals">
                1) Removed: General liability limitation clause.
              </td>
              <td className="similarities"> 20%</td>
            </tr>
            <tr>
              <td className="sno">4</td>
              <td className="entity">
                <strong>Termination</strong>
              </td>
              <td className="differences">
                1) Extended notice period for contract termination.
              </td>
              <td className="addition">
                1) Added: Transition assistance clause post-termination.
              </td>
              <td className="removals">
                1) Removed: Immediate termination option without cause.
              </td>
              <td className="similarities"> 25%</td>
            </tr>
            <tr>
              <td className="sno">5</td>
              <td className="entity">
                <strong>Service Level Agreement</strong>
              </td>
              <td className="differences">
                1) Revised uptime guarantee from 99% to 99.9%.
              </td>
              <td className="addition">
                1) Added: Detailed incident response time commitments.
              </td>
              <td className="removals">
                1) Removed: Vague "best effort" performance clauses.
              </td>
              <td className="similarities"> 35%</td>
            </tr>
            <tr>
              <td className="sno">6</td>
              <td className="entity">
                <strong>Data Protection</strong>
              </td>
              <td className="differences">
                1) Updated data processing terms to comply with GDPR.
              </td>
              <td className="addition">
                1) Added: Regular third-party security audits requirement.
              </td>
              <td className="removals">
                1) Removed: Outdated data retention policies.
              </td>
              <td className="similarities"> 30%</td>
            </tr>
          </tbody>
        </table>

        {/* <table className="table">
          <thead>
            <tr>
              <th className="sno">S.No.</th>
              <th className="entity">Section</th>
              <th className="differences">query</th>
              <th className="addition">ABB Policy</th>
              <th className="removals">Vendor Policy</th>
              <th className="similarities">Score(%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sno">1</td>
              <td className="entity">
                <strong>Red clauses</strong>
              </td>
              <td className="differences">
                • Supplier-GTC has added clauses related to Software on
                Hardware and Title and Risk, while it is missing specific
                details on Packing and Security, Delivery Note, Delivery
                Completion, Installments, and Remedies compared to ABB-GTC.
              </td>
              <td className="addition">
                Supplier-GTC is missing Packing and Security: The Hardware must
                be properly packed and secured to ensure it reaches its
                destination in good condition and without interference during
                transit.
              </td>
              <td className="removals">
                Supplier-GTC has added Software on Hardware: Any software or
                computer programs provided on the Hardware are treated as goods,
                not services. The Supplier must ensure no malicious software,
                viruses, or backdoors are included.
              </td>
              <td className="similarities">{isAnalyzeBoolean ? 240 : ""}</td>
            </tr>
            <tr>
              <td className="sno">2</td>
              <td className="entity">
                <strong>Blue clauses</strong>
              </td>
              <td className="differences">
                Supplier-GTC has added a clause stating that the Supplier
                represents, warrants, and undertakes that the Hardware (in whole
                and in part) will meet the specified conditions.
              </td>
              <td className="addition">
                Supplier-GTC is missing Installments: The Supplier must not
                deliver the Hardware in installments without the Customer’s
                prior written consent.
              </td>
              <td className="removals">
                Supplier-GTC has added a clause stating that the Supplier
                represents, warrants, and undertakes that the Hardware (in whole
                and in part) will meet the specified conditions.
              </td>
              <td className="similarities">{isAnalyzeBoolean ? 400 : ""}</td>
            </tr>  </tbody>
        </table>*/}
        {/* {getFilteredEntities()
              ?.slice(2)
              .map((entity, index) => (
                <tr key={index + 2}>
                  <td className="sno">{index + 3}</td>
                  <td className="entity">
                    <strong>{entity}</strong>
                  </td>
                  <td className="differences">
                    {renderDataCell(entity.toUpperCase(), "Difference")}
                  </td>
                  <td className="addition">
                    {renderDataCell(entity.toUpperCase(), "additions")}
                  </td>
                  <td className="removals">
                    {renderDataCell(entity.toUpperCase(), "removals")}
                  </td>
                  <td className="similarities">
                    {renderDataCell(entity.toUpperCase(), "similarities")}
                  </td>
                </tr>
              ))} */}

        <div className="anlBtn">
          <button
            className="analyzeButton"
            onClick={() => {
              setIsAnalyzeBoolean(!isAnalyzeBoolean);
            }}
          >
            {/* <DownloadIcon className="downloadBackIcon" size="medium" /> */}
            Analyze
          </button>
        </div>
        <div>
          {isAnalyzeBoolean && (
            <>
              <h2>Score</h2>
              <div
                style={{
                  width: "100%",
                  height: 300,
                  cursor: "pointer",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "8px",
                  padding: "10px",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataGraph}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(0)}%`}
                    />
                    <Legend />

                    {/* Display the first, second, and third scores for Red Clauses */}
                    <Bar dataKey="RedClause1" fill="#ff0000" />
                    <Bar dataKey="BlueClause1" fill="#0000ff" />
                    <Bar dataKey="RedClause2" fill="#ff0000" />
                    <Bar dataKey="BlueClause2" fill="#0000ff" />
                    <Bar dataKey="BlueClause3" fill="#0000ff" />
                    <Bar dataKey="RedClause3" fill="#ff0000" />

                    {/* Display the first, second, and third scores for Blue Clauses */}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalyzerComparison;
