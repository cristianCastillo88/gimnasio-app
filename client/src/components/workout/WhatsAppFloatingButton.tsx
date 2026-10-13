import React from "react";

export interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  studentName?: string;
  currentExercise?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  phoneNumber = "5491100000000", // Número del PT configurado
  studentName,
  currentExercise,
}) => {
  // Construir mensaje contextual según el ejercicio actual
  const greeting = studentName ? `Hola Coach, soy ${studentName}.` : "Hola Coach!";
  const context = currentExercise
    ? ` Estoy entrenando ${currentExercise} y tengo una duda sobre la técnica.`
    : " Te escribo desde GymApp para consultarte sobre mi rutina.";

  const message = `${greeting}${context}`;
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar a mi Entrenador por WhatsApp"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "calc(var(--safe-bottom) + 80px)",
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        backgroundColor: "#25D366",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(37, 211, 102, 0.4)",
        zIndex: 80,
        transition: "transform 0.15s ease",
        textDecoration: "none",
      }}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.001-.462-1.503-.623-2.464-2.146-2.538-2.246-.075-.101-.606-.807-.606-1.54 0-.733.383-1.093.52-1.236.136-.144.3-.18.4-.18.1 0 .2 0 .288.005.093.005.218-.035.341.261.125.297.426 1.042.463 1.118.037.075.062.163.013.262-.05.101-.075.163-.15.251-.075.088-.158.196-.226.264-.075.075-.153.157-.066.307.087.15.388.641.834 1.038.574.512 1.059.67 1.209.745.15.075.238.063.326-.038.087-.1.375-.438.475-.588.1-.15.2-.125.338-.075.137.05 1.025.483 1.2.57.175.088.293.131.336.206.043.076.043.438-.101.844zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.006L2 22l5.168-1.317A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
      </svg>
    </a>
  );
};
