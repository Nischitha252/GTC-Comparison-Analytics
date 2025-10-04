// multiple.tsx
import React, { useEffect, useRef, useState } from "react";
import "./gtc.css";
import BrowseFile from "../browse/browse";
import PostFile from "service/postFile";
import Loader from "../loader/loader";
import ProcessFile from "service/processFile";
import LeftArrowIcon from "assets/icon/ip-leftArrow-icon";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import RiskAnalyze from "service/riskPercentage";

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

interface GTCProps {
  onBackClick: () => void;
  onUploadClick: () => void;
  setIsLoader: (isLoading: boolean) => void; // New prop
  onDataListUpdate: (dataList: DataList, data: any) => void; // Add this prop
  onDownloadClick: (blobName: string) => void;
  onTokenCost: (tokenCost: number) => void;
  onRiskDataUpdate: (dataList: ClauseData) => void; //
}

interface GTC {
  name: string;
  value: string;
}

const GTC: React.FC<GTCProps> = ({
  onBackClick,
  onUploadClick,
  setIsLoader,
  onDataListUpdate,
  onDownloadClick,
  onTokenCost,
  onRiskDataUpdate,
}) => {
  const [isIndexName, setIsIndexName] = useState<string | null>(null);
  const [abbGtcFileUpload, setAbbGtcFileUpload] = useState<FileList | null>(
    null
  );
  const [supplierFileUploads, setSupplierFileUploads] = useState<
    (FileList | null)[]
  >([]);
  const [numberOfSuppliers, setNumberOfSuppliers] = useState<number>(0);
  const [isReset, setIsReset] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Loader state
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const [isTokenCost, setIsTokenCost] = useState<number>(0);

  const [selectedPreloadAbbGTC, setSelectedPreloadAbbGTC] =
    useState<string>("");
  const cities: GTC[] = [
    {
      name: "ABB GTC IT Procurement (2024-04)",
      value: "ABB GTC IT Procurement (2024-04)_intl",
    },
    {
      name: "ABB GTC IT Procurement Cloud Schedule (2024-04) & ABB GTC IT Procurement (2024-04)",
      value: "ABB GTC IT Procurement Cloud Schedule (2024-04)",
    },
    {
      name: "ABB GTC IT Procurement Hardware Schedule (2022-03) & ABB GTC IT Procurement (2024-04)",
      value: "ABB GTC IT Procurement Hardware Schedule (2022-03)",
    },
    {
      name: "ABB GTC IT Procurement Software License Schedule (2023-04) & ABB GTC IT Procurement (2024-04)",
      value: "ABB GTC IT Procurement Software License Schedule (2023-04)",
    },
    { name: "Others (Upload your GTC)", value: " " },
  ];

  const handleAbbGTCChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPreloadAbbGTC(event.target.value);
    setAbbGtcFileUpload(null); // Clear previous file selection if any
  };

  const handleUpload = async () => {
    // Implement your upload logic here
    setIsLoading(true); // Show loader
    setIsLoader(false); // Set loader state in parent component

    const supplierFile = supplierFileUploads[0];
    let abbGtcFile = null;
    if (abbGtcFileUpload) {
      abbGtcFile = abbGtcFileUpload[0];
    }

    let isIndexName = null;
    if (selectedPreloadAbbGTC !== " ") {
      isIndexName = selectedPreloadAbbGTC;
    }

    if (supplierFile && supplierFile.length > 0) {
      try {
        const reponse = await PostFile(
          isIndexName,
          abbGtcFile,
          supplierFile[0]
        );
        console.log("response",reponse)
        const processResponse = await ProcessFile(isIndexName, reponse);
        const dataList = processResponse.result;
        const blobName = processResponse.blob_name;
        onDataListUpdate(dataList, processResponse);
        onDownloadClick(blobName);
        const riskResponse = await RiskAnalyze(
          processResponse?.AgreedClauses,
          processResponse?.DisagreedClauses,
          processResponse?.AgreedRedClauses,
          processResponse?.DisagreedRedClauses,
          processResponse?.AgreedBlueClauses,
          processResponse?.DisagreedBlueClauses,
          processResponse?.Entities,
          processResponse?.RedClauses,
          processResponse?.BlueClauses
        );
        onRiskDataUpdate(riskResponse);
      } catch (error) {
        console.error("Error uploading or processing files:", error);
      }
    }
    onUploadClick(); // Trigger callback if needed
    setIsLoading(false); // Hide loader after upload completes
  };

  const handleAbbGtcFileUpload = (file: FileList | null) => {
    if (file && file.length > 0) {
      setAbbGtcFileUpload(file);
    }
  };

  // Define options for the dropdown
  const supplierOptions = Array.from({ length: 1 }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const handleSupplierFileUpload = (index: number, file: FileList | null) => {
    const newUploads = [...supplierFileUploads];
    newUploads[index] = file;
    setSupplierFileUploads(newUploads);
  };

  // const handleNumberOfSuppliersChange = (
  //   event: React.ChangeEvent<HTMLSelectElement>
  // ) => {
  //   const count = parseInt(event.target.value, 10) || 0;
  //   setNumberOfSuppliers(count);
  //   setSupplierFileUploads(Array(count).fill(null));
  // };

  const handleNumberOfSuppliersChange = (event: DropdownChangeEvent) => {
    const count = event.value as number; // Accessing the selected value
    setNumberOfSuppliers(count);
    setSupplierFileUploads(Array(count).fill(null));
  };
  const handleReset = () => {
    setIsReset(true);
    setSelectedPreloadAbbGTC("");
    setAbbGtcFileUpload(null);
    setSupplierFileUploads([]);
    setNumberOfSuppliers(0);
    // Toggle isReset back to false after a short delay to allow for the reset to take effect
    setTimeout(() => {
      setIsReset(false);
    }, 0);
  };
  const isSupplierUploadEnabled =
    selectedPreloadAbbGTC &&
    (selectedPreloadAbbGTC !== "others" || abbGtcFileUpload);
  const areSupplierGtcFilesUploaded = supplierFileUploads.every(
    (file) => file !== null
  );

  // Call scrollToBottom whenever content changes
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    isSupplierUploadEnabled,
    numberOfSuppliers,
    areSupplierGtcFilesUploaded,
    isReset,
  ]);

  const [isCentered, setIsCentered] = useState(false);

  useEffect(() => {
    // Function to check if the window width is between 950px and 1000px
    function updateDropdownPosition() {
      setIsCentered(window.innerWidth < 1800);
    }

    // Initial check
    updateDropdownPosition();

    // Update on resize
    window.addEventListener("resize", updateDropdownPosition);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", updateDropdownPosition);
  }, []);

  return (
    <div className="multipleGTC">
      {!isLoading && (
        <>
          <button className="multipleBackButton" onClick={onBackClick}>
            <LeftArrowIcon
              className="multipleBackIcon"
              // name="abb/left-arrow"
              size="medium"
            />
            Back
          </button>
          <p style={{ fontSize: "18px", fontWeight: "600" }}>
            Please select options and upload documents(s) below for GTC
            comparison
          </p>
          <div className="main">
            <div>
              <div className="preloadAndUserUpload">
                <label htmlFor="selectPreloadAbbGTC" className="labelHeading">
                  Select ABB GTC:
                </label>
                {/* <div className="card"> */}
                <Dropdown
                  value={selectedPreloadAbbGTC}
                  onChange={(e: DropdownChangeEvent) => {
                    setSelectedPreloadAbbGTC(e.value);
                  }}
                  options={cities}
                  optionLabel="name"
                  placeholder="Select a GTC"
                  className="dropdown"
                  style={{ width: "300px" }}
                  panelClassName={
                    isCentered ? "centered-dropdown" : "default-dropdown"
                  }
                />
                {/* </div> */}

                {/* <select
                  id="selectPreloadAbbGTC"
                  className="selectPreloadAbbGTC"
                  value={selectedPreloadAbbGTC}
                  onChange={handleAbbGTCChange}
                >
                  <option />

                  <option value="ABB GTC IT Procurement Hardware Schedule (2022-03)">
                    ABB GTC IT Procurement (2024-04)
                  </option>
                  <option value="ABB GTC IT Procurement Cloud Schedule (2024-04)">
                    ABB GTC IT Procurement Cloud Schedule (2024-04) & ABB GTC IT
                    Procurement (2024-04)
                  </option>
                  <option
                    value="ABB GTC IT Procurement Hardware Schedule (2022-03)&&ABB GTC
                    IT Procurement (2024-04)"
                  >
                    ABB GTC IT Procurement Hardware Schedule (2022-03) & ABB GTC
                    IT Procurement (2024-04)
                  </option>
                  <option value="ABB GTC IT Procurement Software License Schedule (2023-04)">
                    ABB GTC IT Procurement Software License Schedule (2023-04) &
                    ABB GTC IT Procurement (2024-04)
                  </option>
                  <option value=" ">Others (Upload your GTC)</option>
                </select> */}

                {selectedPreloadAbbGTC === " " && (
                  <BrowseFile
                    inputId="AbbGtcFileUpload"
                    multiple={false}
                    disabled={false}
                    reset={isReset}
                    activateFileName={true}
                    onFileUpload={handleAbbGtcFileUpload}
                  />
                )}
              </div>

              <div className="numberOfSupplier">
                <label htmlFor="selectNumberSupplier" className="labelHeading">
                  Select number of vendor(s):
                </label>
                <Dropdown
                  id="selectNumberSupplier"
                  className="dropdown"
                  value={numberOfSuppliers}
                  options={supplierOptions}
                  onChange={handleNumberOfSuppliersChange}
                  placeholder="Select Suppliers"
                  disabled={!selectedPreloadAbbGTC || !isSupplierUploadEnabled}
                  style={{ width: "100px" }}
                />
                {/* <select
                  id="selectNumberSupplier"
                  className="selectNumberOfSupplier"
                  disabled={!selectedPreloadAbbGTC || !isSupplierUploadEnabled}
                  value={numberOfSuppliers}
                  onChange={handleNumberOfSuppliersChange}
                >
                  <option value="" />
                  {[...Array(4)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select> */}
              </div>

              <div className="supplierFileUploadsBox">
                <div className="supplierFileUploadsText labelHeading">
                  Upload vendor GTC:
                </div>
                {Array.from({ length: numberOfSuppliers }).map((_, index) => (
                  <div key={index} className="supplierFileUpload">
                    <BrowseFile
                      inputId={`supplierFileUpload_${index}`}
                      multiple={false}
                      disabled={
                        !selectedPreloadAbbGTC || !isSupplierUploadEnabled
                      }
                      reset={isReset}
                      activateFileName={true}
                      onFileUpload={(file) =>
                        handleSupplierFileUpload(index, file)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="resetAndUploadButtonBox">
            <button className="resetButton" onClick={handleReset}>
              Reset
            </button>

            <button
              className="uploadButton"
              onClick={handleUpload}
              disabled={
                !isSupplierUploadEnabled || !areSupplierGtcFilesUploaded
              }
            >
              Upload
            </button>
          </div>
        </>
      )}

      {isLoading && <Loader loaderContent="Analyzing..." />}

      <div ref={scrollBottomRef}></div>
    </div>
  );
};

export default GTC;
