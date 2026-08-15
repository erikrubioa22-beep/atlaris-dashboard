import { useEffect } from "react";

export default function FinanceBridge() {
  useEffect(() => {
    let timer;

    const install = () => {
      if (document.querySelector(".finance-nav")) return true;

      const groups = [...document.querySelectorAll(".nav-group")];
      const admin = groups.find(
        (group) => group.querySelector(".sidebar-section-label")?.textContent.trim() === "Administration",
      );
      const host = admin?.querySelector(".nav-list");
      if (!host) return false;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "nav-link finance-nav";
      button.innerHTML = "<span>▦</span>Finance & Administration";
      button.addEventListener("click", () => {
        if (window.AtlarisFinance?.open) {
          window.AtlarisFinance.open();
        } else {
          window.dispatchEvent(new CustomEvent("atlaris-open-finance"));
        }
      });
      host.appendChild(button);
      return true;
    };

    install();
    timer = window.setInterval(() => {
      if (install()) window.clearInterval(timer);
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
