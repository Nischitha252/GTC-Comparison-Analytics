// commercial.tsx
import React, { useState } from "react";
import "./comparison.css";
import entities from "component/content/content.json";
import DownloadIcon from "assets/icon/ip-download-icon";
import LeftArrowIcon from "assets/icon/ip-leftArrow-icon";
import { BLOB_STORAGE_URL } from "config";

type DataList = {
  [entity: string]: {
    similarities: string[];
    additions: string[];
    removals: string[];
    differences: string;
  };
};

interface ComparisonProps {
  onBackClick: () => void;
  dataList: DataList;
  blobName: string;
  tokenCost: number;
  setRiskAnalyzerSelected: (value: boolean) => void;
}

const Comparison: React.FC<ComparisonProps> = ({
  onBackClick,
  dataList,
  blobName,
  tokenCost,
  setRiskAnalyzerSelected,
}) => {
  const [selectedClauseType, setSelectedClauseType] = useState<
    "all" | "red" | "nonRed" | "risk"
  >("all");
  const [isErrorAnalyse, setIsErrorAnalyse] = useState<number>(0);

  const data: DataList = dataList;

  // const renderDataCell = (section: string, type: keyof DataList[keyof DataList]) => {
  //     const sectionData = data[section];
  //     if (!sectionData || !sectionData[type]) {
  //         return '';
  //     }
  //     const cellData = sectionData[type];
  //     const items = Array.isArray(cellData) ? cellData : [cellData];
  //     return (
  //         <ul>
  //             {items.map((item, index) => (
  //                 <li key={index}>{item}</li>
  //             ))}
  //         </ul>
  //     );
  // };
  const renderDataCell = (
    section: string,
    type: keyof DataList[keyof DataList]
  ) => {
    const sectionData = data[section];
    if (!sectionData || !sectionData[type]) {
      return "";
    }
    const cellData = sectionData[type];
    const items = Array.isArray(cellData) ? cellData : [cellData];

    return (
      <ul>
        {items?.map((item, index) => (
          <li key={index}>
            {item?.split(/(\*\*.*?\*\*)/g)?.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </li>
        ))}
      </ul>
    );
  };

  // const getFilteredEntities = () => {
  // if (selectedClauseType === 'red') {
  //     return entities.redClauses;
  // } else if (selectedClauseType === 'nonRed') {
  //     return entities.nonRedClauses;
  // } else {
  //     return Object.keys(dataList1);
  // }
  // };

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

  const getFilteredEntities = () => {
    const redClause = new Set(
      entities.redClauses?.map((clause) => clause.toUpperCase())
    );

    if (selectedClauseType === "red") {
      return Object.keys(dataList).filter((key) => redClause.has(key));
    } else if (selectedClauseType === "nonRed") {
      return Object.keys(dataList).filter((key) => !redClause.has(key));
    } else {
      return Object.keys(dataList);
    }
  };

  return (
    <div className="tableBox">
      {/* <button className="backButton" onClick={onBackClick}>
        <LeftArrowIcon className="backIcon" size="medium" />
        Back
      </button> */}
      <div className="buttons">
        {/* { tokenCost > 0 && (
                    <> */}
        <button className="backButton" onClick={onBackClick}>
          <LeftArrowIcon className="backIcon" size="medium" />
          Back
        </button>
        <div className="clauseButton">
          <button
            className={`allClauseButton ${
              selectedClauseType === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedClauseType("all")}
          >
            All Clause
          </button>

          <button
            className={`redClauseButton ${
              selectedClauseType === "red" ? "active" : ""
            }`}
            onClick={() => setSelectedClauseType("red")}
          >
            Red Clause
          </button>

          <button
            className={`nonRedClauseButton ${
              selectedClauseType === "nonRed" ? "active" : ""
            }`}
            onClick={() => setSelectedClauseType("nonRed")}
          >
            Blue Clause
          </button>
          <button
            className={`AllClauseButton ${
              selectedClauseType === "risk" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedClauseType("risk");
              setRiskAnalyzerSelected(true);
            }}
          >
            Risk Analyzer
          </button>
        </div>
        <div>
          <button className="downloadButton" onClick={handleDownloadClick}>
            <DownloadIcon className="downloadBackIcon" size="medium" />
            Download
          </button>
        </div>
      </div>

      {/* {!tokenCost && <h2 className="errorAnalyzing"> Error Analyzing </h2>} */}

      {/* {tokenCost > 0 && ( */}
      <div className="tableContainer">
        <div className="tableWrapper">
          <table className="table">
            <thead>
              <tr>
                <th className="sno">S.No.</th>
                <th className="entity">Clauses</th>
                <th className="differences">Differences</th>
                <th className="addition">Addition</th>
                <th className="removals">Removals</th>
                <th className="similarities">Similarities</th>
              </tr>
            </thead>

            <tbody>
              {getFilteredEntities()?.map((entity, index) => (
                <tr key={index}>
                  <td className="sno">{index + 1}</td>
                  <td className="entity">
                    <strong>{entity}</strong>
                  </td>
                  <td className="differences">
                    {renderDataCell(entity.toUpperCase(), "differences")}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* )} */}
    </div>
  );
};

export default Comparison;
