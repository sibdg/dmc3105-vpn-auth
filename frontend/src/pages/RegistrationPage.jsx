import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationWizard from "../components/RegistrationWizard";

export default function RegistrationPage({ notify }) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleSuccess = (result) => {
    if (result?.flow === "registration") {
      notify("success", "Регистрация завершена.");
    }
    navigate("/connection");
  };

  return (
    <div className="mx-auto" style={{ maxWidth: "460px" }}>
      <RegistrationWizard notify={notify} onSuccess={handleSuccess} onStepChange={setStep} />
    </div>
  );
}
