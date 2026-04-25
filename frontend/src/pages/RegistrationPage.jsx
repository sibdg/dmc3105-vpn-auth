import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GuideLinks from "../components/GuideLinks";
import RegistrationWizard from "../components/RegistrationWizard";

export default function RegistrationPage({ notify }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSuccess = () => {
    notify("success", "Регистрация завершена.");
    navigate("/connection");
  };

  return (
    <>
      <RegistrationWizard notify={notify} onSuccess={handleSuccess} onStepChange={setStep} />
      {step === 3 && <GuideLinks />}
    </>
  );
}
