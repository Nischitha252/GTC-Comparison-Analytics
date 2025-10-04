// postFile.tsx
import http from "./http";

const PostFile = async (
  indexName: string | null,
  abbGtcFileUpload: File | null,
  supplierFileUploads: File | null
) => {
  const formData = new FormData();

  if (indexName) {
    formData.append("index_name", indexName);
  }

  if (abbGtcFileUpload) {
    formData.append("abb_gtc", abbGtcFileUpload); // Assuming single file upload
  }

  if (supplierFileUploads) {
    formData.append("supplier_gtc", supplierFileUploads); // Assuming single file upload for supplier
  }

  try {
    const response = await http.post("/upload_IS_GTC", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to trigger /processfile. Status: ${response.status}`
      );
    }

    return response.data.files; // Return data or handle as needed
  } catch (error: any) {
    console.error("Error uploading files:", error.message);
    throw error; // Throw or handle error as needed
  }
};

export default PostFile;
