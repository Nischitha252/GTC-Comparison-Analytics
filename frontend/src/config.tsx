//config.tsx
import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
  auth: {
    authority:
      "https://login.microsoftonline.com/372ee9e0-9ce0-4033-a64a-c07073a91ecd",
    clientId: "87b94c41-6296-49ac-ab66-60be56934dee",
    redirectUri: document.getElementById("root")?.baseURI || "",
    postLogoutRedirectUri: "/",
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
  },
};

export const EXCEL_API_BASE_URL =
  "https://isprocure-testing.azurewebsites.net/";

// export const EXCEL_API_BASE_URL = "https://im-s-backend-testing.azurewebsites.net";

export const MICROSOFT_FORMS_URL = "https://forms.microsoft.com/e/LVMf1wE7Wg";

export const CONTACT_US = "mailto:venkatesha.vc@in.abb.com";

export const BLOB_STORAGE_URL =
  "https://imsindirectstorage.blob.core.windows.net/downloadedfiles";
