import http from "./http";

interface RiskAnalyzePayload {
  AgreedClauses: string[];
  DisagreedClauses: string[];
  AgreedRedClauses: string[];
  DisagreedRedClauses: string[];
  AgreedBlueClauses: string[];
  DisagreedBlueClauses: string[];
  Entities: string[];
  RedClauses: string[];
  BlueClauses: string[];
}

const RiskAnalyze = async (
  AgreedClauses: string[],
  DisagreedClauses: string[],
  AgreedRedClauses: string[],
  DisagreedRedClauses: string[],
  AgreedBlueClauses: string[],
  DisagreedBlueClauses: string[],
  Entities: string[],
  RedClauses: string[],
  BlueClauses: string[]
) => {
  const payload: RiskAnalyzePayload = {
    AgreedClauses: AgreedClauses,
    DisagreedClauses: DisagreedClauses,
    AgreedRedClauses: AgreedRedClauses,
    DisagreedRedClauses: DisagreedRedClauses,
    AgreedBlueClauses: AgreedBlueClauses,
    DisagreedBlueClauses: DisagreedBlueClauses,
    Entities: Entities,
    RedClauses: RedClauses,
    BlueClauses: BlueClauses,
  };

  try {
    const response = await http.post("/risk_percentage", payload, {
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
    console.error("Error uploading files:", error.message);
    throw error;
  }
};

export default RiskAnalyze;
