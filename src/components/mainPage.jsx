import React from "react";
import WizardPage from "./WizardPage";
import AdvancedPage from "./AdvancedPage";

function MainPage({ mode, question, answer, inverter, space }) {
  return mode === "wizard" ? (
    <WizardPage question={question} />
  ) : (
    <AdvancedPage question={question} answer={answer} inverter={inverter} space={space} />
  );
}

export default MainPage;
