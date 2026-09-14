import { useState } from "react";

import { loadPersonalEvents } from "./personal-events-source.js";
import { loadLifeSettings } from "./life-settings-source.js";
import { workspaceStore } from "./workspace-store.js";

export default function useAdministratorData({
  applyServerPersonalEvents,
  applyServerLifeSettings,
}) {
  const [
    administratorDataStatus,
    setAdministratorDataStatus,
  ] = useState("");

  const loadAdministratorData = async () => {
    setAdministratorDataStatus("");

    try {
      const [
        personalEvents,
        lifeSettings,
      ] = await Promise.all([
        loadPersonalEvents(),
        loadLifeSettings(),
      ]);

      if (personalEvents === null) {
        throw new Error(
          "個人史TSVを取得できませんでした"
        );
      }

      if (lifeSettings === null) {
        throw new Error(
          "人生設定TSVを取得できませんでした"
        );
      }

      await workspaceStore
        .administratorData
        .save({
          personalEvents,
          lifeSettings,
        });

      applyServerPersonalEvents(
        personalEvents
      );
      applyServerLifeSettings(
        lifeSettings
      );
      setAdministratorDataStatus(
        `管理者データを読み込み、ブラウザに保存しました（自分史 ${personalEvents.length}件）`
      );
    } catch (err) {
      console.error(
        "Administrator data could not be loaded:",
        err
      );
      setAdministratorDataStatus(
        `管理者データの読み込み失敗: ${
          err?.message || String(err)
        }`
      );
    }
  };

  const clearAdministratorBrowserData =
    async () => {
      const ok = window.confirm(
        "ブラウザに保存した管理者データ（あなたの設定・自分史）を消去しますか？" +
          " 通常のブラウザ設定と編集用の自分史は消去しません。"
      );

      if (!ok) return;

      try {
        await workspaceStore
          .administratorData
          .clear();

        window.location.reload();
      } catch (err) {
        console.error(
          "Administrator browser data could not be cleared:",
          err
        );
        setAdministratorDataStatus(
          `管理者データの消去失敗: ${err?.message || String(err)}`
        );
      }
    };

  const authenticateAndLoadAdministratorData = () => {
    setAdministratorDataStatus(
      "管理者認証を確認しています…"
    );

    let timeoutId = null;

    const cleanup = () => {
      window.removeEventListener(
        "message",
        handleAuthenticated
      );

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };

    const handleAuthenticated = (event) => {
      if (
        event.origin !== window.location.origin ||
        event.data?.type !==
          "koshix-admin-authenticated"
      ) {
        return;
      }

      cleanup();
      loadAdministratorData();
    };

    window.addEventListener(
      "message",
      handleAuthenticated
    );

    const authWindow = window.open(
      `${import.meta.env.BASE_URL}personal/auth.html`,
      "koshix-timeline-admin-auth",
      "popup=yes,width=520,height=360,resizable=yes,scrollbars=yes"
    );

    if (!authWindow) {
      cleanup();
      setAdministratorDataStatus(
        "管理者認証画面を開けませんでした。ポップアップを許可して、もう一度お試しください。"
      );
      return;
    }

    timeoutId = window.setTimeout(() => {
      cleanup();
      setAdministratorDataStatus(
        "管理者認証が完了しませんでした。もう一度お試しください。"
      );
    }, 120000);
  };

  return {
    administratorDataStatus,
    authenticateAndLoadAdministratorData,
    clearAdministratorBrowserData,
  };
}
