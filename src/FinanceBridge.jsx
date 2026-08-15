import { useEffect } from "react";

export default function FinanceBridge() {
  useEffect(() => {
    let timer;
    let attempts = 0;

    const placeFinanceNav = () => {
      attempts += 1;

      const groups = [...document.querySelectorAll(".nav-group")];
      const admin = groups.find(
        (group) =>
          group.querySelector(".sidebar-section-label")?.textContent.trim() ===
          "Administration",
      );
      const host = admin?.querySelector(".nav-list");
      const financeButton = document.querySelector(".finance-nav");

      if (host && financeButton) {
        if (financeButton.parentElement !== host) host.appendChild(financeButton);
        window.clearInterval(timer);
        return;
      }

      if (attempts >= 40) window.clearInterval(timer);
    };

    placeFinanceNav();
    timer = window.setInterval(placeFinanceNav, 100);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
