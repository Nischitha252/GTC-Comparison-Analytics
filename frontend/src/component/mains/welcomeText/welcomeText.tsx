import React from "react";
import "./welcomeText.css";
// Define the props interface
interface WelcomeTextProps {
  isLoading: boolean;
}

const WelcomeText: React.FC<WelcomeTextProps> = ({ isLoading }) => {
  return (
    <div className="welcomeText">
      <div className="redLine" />
      <h2>Welcome to IS Procurement</h2>
      <p>
        IS procurement is the strategic process of acquiring and managing
        technology-related products and services to support and enhance an
        organization's information systems.
      </p>
      {isLoading && (
        <h3>Please click the option(s) below for GTC comparison:</h3>
      )}
    </div>
  );
};

export default WelcomeText;
