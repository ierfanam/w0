import React from "react";
import { useTranslation } from "react-i18next";

export function QuotaSettings() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-[16px] font-medium text-white mb-4 translate">
        {t("usage.usage")}
      </h2>

      {/* Progress Card */}
      <div className="bg-blue-500/85 dark:bg-blue-700/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] text-white translate">
            {t("usage.unlimited")}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-black/20 rounded-full h-1.5 mb-2">
          <div className="bg-blue-500 h-full rounded-full" style={{ width: "100%" }} />
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-white translate">{t("usage.unlimited")}</span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-gray-400 translate">{t("usage.type")}</span>
          <span className="dark:text-white translate">{t("usage.unlimited")}</span>
        </div>
      </div>
    </div>
  );
}
