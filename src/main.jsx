import React from "react";
import { createRoot } from "react-dom/client";
import { prepareEvents } from "./events-source";
import {
  loadConfig,
  prepareConfig,
} from "./config-source";
import { recordAccess } from "./access-stats";
import "./styles.css";

async function bootstrap() {
  // App.jsx を読み込む前に公開TSVを準備する。
  // これにより App.jsx 内では従来どおり同期的に EVENTS を扱える。
  await Promise.all([
    prepareConfig(),
    prepareEvents(),
  ]);

  void recordAccess({
    endpoint: loadConfig().accessStats?.endpoint,
  });

  const threadWindowMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search)
      .get("threads") === "1";

  const { default: RootApp } = threadWindowMode
    ? await import("./ThreadApp.jsx")
    : await import("./App.jsx");

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <RootApp />
    </React.StrictMode>
  );
}

bootstrap().catch((err) => {
  console.error("Application bootstrap failed:", err);
});
