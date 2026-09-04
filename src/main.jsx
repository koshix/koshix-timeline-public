import React from "react";
import { createRoot } from "react-dom/client";
import { prepareEvents } from "./events-source";
import { prepareConfig } from "./config-source";
import "./styles.css";

async function bootstrap() {
  // App.jsx を読み込む前に公開TSVを準備する。
  // これにより App.jsx 内では従来どおり同期的に EVENTS を扱える。
  await Promise.all([
    prepareConfig(),
    prepareEvents(),
  ]);

  const { default: App } = await import("./App.jsx");

  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap().catch((err) => {
  console.error("Application bootstrap failed:", err);
});
