// welcome.tsx
import React, { useState } from "react";
import "./welcome.css";
import WelcomeText from "component/mains/welcomeText/welcomeText";
import Footer from "component/mains/footer/footer";
import Header from "component/mains/header/header";
import Cards from "component/mains/card/cards";
import GTC from "component/mains/gtc/gtc";
import Comparison from "../comparison/comparison";
import Commercial from "component/mains/commercial/commercial";
import RiskAnalyzerComparison from "../../pages/comparison/riskAnalyzer";

type DataList = {
  [entity: string]: {
    similarities: string[];
    additions: string[];
    removals: string[];
    differences: string;
  };
};

type ClauseData = {
  AgreedClausePercentage: number;
  AgreedBlueClausesPercentage: number;
  AgreedRedClausePercentage: number;
  DisagreedBlueClausesPercentage: number;
  DisagreedClausePercentage: number;
  DisagreedRedClausesPercentage: number;
  RiskPosition: string;
};

const Welcome: React.FC = () => {
  const [showCards, setShowCards] = useState<boolean>(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [blobName, setBlobName] = useState<string>("");
  const [uploadCompleted, setUploadCompleted] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataList, setDataList] = useState<DataList>({});
  const [isTokenCost, setIsTokenCost] = useState<number>(0);
  const [riskAnalyzerSelected, setRiskAnalyzerSelected] =
    useState<boolean>(false);
  const [riskCountData, setRiskCountData] = useState<any[]>([]);
  const [riskSummary, setRiskSummary] = useState<Partial<ClauseData>>({
    AgreedClausePercentage: 0,
    DisagreedClausePercentage: 0,
    AgreedRedClausePercentage: 0,
    DisagreedRedClausesPercentage: 0,
    AgreedBlueClausesPercentage: 0,
    DisagreedBlueClausesPercentage: 0,
    RiskPosition: "",
  });

  const handleRiskDataUpdate = (newDataRiskSummary: ClauseData) => {
    setRiskSummary(newDataRiskSummary);
    // Handle dataList update as needed
  };
  const handleCardClick = (category: string) => {
    setSelectedCard(category);
    setShowCards(false); // Hide the cards after a selection
  };

  const handleBackClick = () => {
    setShowCards(true);
    setSelectedCard(null);
    setUploadCompleted(false);
  };

  const handleRiskAnalyzerReset = () => {
    setRiskAnalyzerSelected(false);
  };

  const handleUploadClick = () => {
    setUploadCompleted(true);
  };

  const handleDataListUpdate = (newDataList: DataList, data?: any) => {
    setDataList(newDataList);
    setRiskCountData(data);
    // Handle dataList update as needed
  };

  const handleDownloadClick = (blobName: string) => {
    setBlobName(blobName);
  };

  const handleTokenCost = (tokenCost: number) => {
    setIsTokenCost(tokenCost);
  };

  return (
    <div>
      <Header />
      <div className="welcome">
        <div className="welcomeAndCardBox">
          {(showCards || selectedCard === "GTC") && !uploadCompleted && (
            <WelcomeText isLoading={isLoading} />
          )}

          {showCards && <Cards onCardClick={handleCardClick} />}

          {selectedCard === "GTC" &&
            !uploadCompleted &&
            riskAnalyzerSelected === false && (
              <GTC
                onBackClick={handleBackClick}
                onUploadClick={handleUploadClick}
                setIsLoader={setIsLoading}
                onDataListUpdate={handleDataListUpdate}
                onDownloadClick={handleDownloadClick}
                onTokenCost={handleTokenCost}
                onRiskDataUpdate={handleRiskDataUpdate}
              />
            )}
        </div>
        {uploadCompleted && riskAnalyzerSelected === false && (
          <Comparison
            onBackClick={handleBackClick}
            dataList={dataList}
            blobName={blobName}
            tokenCost={isTokenCost}
            setRiskAnalyzerSelected={setRiskAnalyzerSelected}
          />
        )}

        {riskAnalyzerSelected && (
          <RiskAnalyzerComparison
            onBackClick={handleRiskAnalyzerReset}
            setRiskAnalyzerSelected={setRiskAnalyzerSelected}
            riskCount={riskCountData}
            riskSummary={riskSummary}
            blobName={blobName}
          />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Welcome;
