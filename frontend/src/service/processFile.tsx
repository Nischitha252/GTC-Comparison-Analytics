// processFile.tsx
import axios from "axios";
import http from "./http";

type FileDetail = {
  blob_name: string;
  file_url: string;
  name: string;
  original_filename: string;
  folder_name: string;
};

const processFiles = async (
  indexName: string | null,
  companyGtcURL: FileDetail[]
): Promise<any> => {
  const requestBody: any = {};

  if (indexName) {
    requestBody.index_name = indexName;
  }

  if (companyGtcURL.length > 1) {
    requestBody.company_gtc_url = companyGtcURL[0].file_url;
    requestBody.supplier_gtc_url = companyGtcURL[0].file_url;
    requestBody.folder_name = companyGtcURL[0].folder_name;
  } else {
    requestBody.supplier_gtc_url = companyGtcURL[0].file_url;
    requestBody.folder_name = companyGtcURL[0].folder_name;
  }

  try {
    const response = await http.post("/process_IS_GTC", requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to trigger /processfile. Status: ${response.status}`
      );
    }

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data);
    } else {
      console.error("Error uploading or processing files:", error.message);
    }
    throw error; // Rethrow the error for further handling if needed
  }
};

export default processFiles;
