export default function TimelineDisplayControls({
  controlTargets,
  setAllCats,
  allCatsOn,
  allCatsOff,
  importanceMin,
  setImportanceLevel,
  closedStages,
  expandAllStages,
  collapseStages,
  earlyHistoryOpen,
  setEarlyHistoryOpen,
  hasEarlyHistory,
  isEventOpen,
  openOnlyEvents,
  closeAllEvents,
  font,
}) {
  const allStagesClosed =
    controlTargets.allStageKeys.length > 0 &&
    controlTargets.allStageKeys.every(
      (key) => closedStages.has(key)
    );

  const allPeriodFramesClosed =
    allStagesClosed &&
    (!hasEarlyHistory || !earlyHistoryOpen);

  const allEventsOpen =
    controlTargets.allEventIds.length > 0 &&
    controlTargets.allEventIds.every(isEventOpen);

  const toggleAllStages = () => {
    if (allPeriodFramesClosed) {
      if (hasEarlyHistory) {
        setEarlyHistoryOpen(true);
      }
      expandAllStages();
    } else {
      setEarlyHistoryOpen(false);
      collapseStages(controlTargets.allStageKeys);
    }
  };

  const toggleAllEvents = () => {
    if (allEventsOpen) {
      closeAllEvents();
    } else {
      openOnlyEvents(controlTargets.allEventIds);
    }
  };

  return (
    <div
      aria-label="年表表示操作"
      className="timeline-display-controls"
      style={{
        "--timeline-font": font,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        width: "100%",
      }}
    >
      <div
        style={{ display: "contents" }}
      >
        <div
          role="group"
          aria-label="分野の一括表示切替"
        className="timeline-control-group timeline-control-group--categories"
      >
        <span className="timeline-control-label">分野</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={() => setAllCats(true)}
            aria-pressed={allCatsOn}
            className="timeline-control-button"
            data-strong="true"
          >
            全て表示
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={() => setAllCats(false)}
            aria-pressed={allCatsOff}
            className="timeline-control-button"
          >
            全て隠す
          </button>
        </span>
      </div>

      <div
        role="group"
        aria-label="重要度による表示"
        className="timeline-control-group timeline-control-group--importance"
      >
        <span className="timeline-control-label">重要度</span>

        <span className="timeline-control-segments">
          {[3, 2, 1].map((level, index) => (
            <span key={level} className="timeline-control-segment">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="timeline-control-separator"
                />
              )}
              <button
                type="button"
                onClick={() => setImportanceLevel(level)}
                aria-pressed={importanceMin === level}
                className="timeline-control-button"
              >
                {level === 3
                  ? "重要のみ"
                  : level === 2
                    ? "標準以上"
                    : "全て"}
              </button>
            </span>
          ))}
        </span>
      </div>

      </div>

      <div
        style={{ display: "contents" }}
      >
        <div
          role="group"
          aria-label="期間枠の一括開閉"
        className="timeline-control-group timeline-control-group--periods"
      >
        <span className="timeline-control-label">期間枠</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={toggleAllStages}
            aria-label={
              allPeriodFramesClosed
                ? "全期間枠を開く"
                : "全期間枠を閉じる"
            }
            className="timeline-control-button"
            data-strong="true"
          >
            {allPeriodFramesClosed
              ? "全て開く"
              : "全て閉じる"}
          </button>
        </span>
      </div>

      <div
        role="group"
        aria-label="解説枠の一括開閉"
        className="timeline-control-group timeline-control-group--explanations"
      >
        <span className="timeline-control-label">解説枠</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={toggleAllEvents}
            aria-label={
              allEventsOpen
                ? "全解説枠を閉じる"
                : "全解説枠を開く"
            }
            className="timeline-control-button"
            data-strong="true"
          >
            {allEventsOpen
              ? "全て閉じる"
              : "全て開く"}
          </button>
        </span>
      </div>
      </div>
    </div>
  );
}
