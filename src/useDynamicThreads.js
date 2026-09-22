import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { buildDynamicThread } from "./thread-model.js";
import { workspaceStore } from "./workspace-store.js";

export default function useDynamicThreads({
  events,
  initialQuery = "",
}) {
  const initialDynamicResult = useMemo(
    () =>
      initialQuery.trim()
        ? buildDynamicThread({
            query: initialQuery,
            events,
          })
        : null,
    [initialQuery, events]
  );

  const [query, setQuery] = useState(initialQuery);
  const nextDynamicThreadId = useRef(1);

  const [dynamicThreads, setDynamicThreads] =
    useState([]);

  const [dynamicFeedback, setDynamicFeedback] =
    useState(() =>
      initialDynamicResult?.thread
        ? null
        : initialDynamicResult
    );

  const [
    threadQueriesLoaded,
    setThreadQueriesLoaded,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restoreThreadQueries = async () => {
      const savedQueries =
        await workspaceStore.threadQueries.load();

      if (cancelled) return;

      const restoredResults = savedQueries
        .map((savedQuery) =>
          buildDynamicThread({
            query: savedQuery,
            events,
          })
        )
        .filter((result) => result.thread);

      if (
        initialDynamicResult?.thread &&
        !restoredResults.some(
          (result) =>
            result.thread.query ===
            initialDynamicResult.thread.query
        )
      ) {
        restoredResults.unshift(
          initialDynamicResult
        );
      }

      nextDynamicThreadId.current =
        restoredResults.length + 1;

      setDynamicThreads(
        restoredResults.map(
          (result, index) => ({
            id: index + 1,
            result,
          })
        )
      );

      setThreadQueriesLoaded(true);
    };

    restoreThreadQueries().catch((err) => {
      console.error(
        "Browser thread queries could not be loaded; automatic saving is disabled:",
        err
      );
    });

    return () => {
      cancelled = true;
    };
  }, [
    events,
    initialDynamicResult,
  ]);

  useEffect(() => {
    if (!threadQueriesLoaded) return;

    const queries = dynamicThreads
      .map(
        (entry) =>
          entry.result.thread?.query
      )
      .filter(Boolean);

    workspaceStore.threadQueries
      .save(queries)
      .catch(() => {});
  }, [
    dynamicThreads,
    threadQueriesLoaded,
  ]);

  const createDynamicThread = () => {
    const result = buildDynamicThread({
      query,
      events,
    });

    if (result.thread) {
      setDynamicThreads((previous) => [
        ...previous,
        {
          id: nextDynamicThreadId.current++,
          result,
        },
      ]);
      setDynamicFeedback(null);
      return;
    }

    setDynamicFeedback(result);
  };

  const removeDynamicThread = (id) => {
    setDynamicThreads((previous) =>
      previous.filter(
        (entry) => entry.id !== id
      )
    );
  };

  return {
    initialDynamicResult,
    query,
    setQuery,
    dynamicThreads,
    dynamicFeedback,
    createDynamicThread,
    removeDynamicThread,
  };
}
