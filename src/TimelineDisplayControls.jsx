export default function TimelineDisplayControls({
  controlTargets,
  setAllCats,
  importanceMin,
  setImportanceLevel,
  closedStages,
  expandAllStages,
  collapseStages,
  isEventOpen,
  openOnlyEvents,
  closeAllEvents,
  font,
}) {
  const allStagesOpen =
    controlTargets.allStageKeys.every(
      (key) => !closedStages.has(key)
    );

  const allEventsOpen =
    controlTargets.allEventIds.length > 0 &&
    controlTargets.allEventIds.every(isEventOpen);

  const toggleAllStages = () => {
    if (allStagesOpen) {
      collapseStages(controlTargets.allStageKeys);
    } else {
      expandAllStages();
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
      style={{ "--timeline-font": font }}
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
            className="timeline-control-button"
            data-strong="true"
          >
            すべて表示
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={() => setAllCats(false)}
            className="timeline-control-button timeline-control-button--muted"
          >
            すべて隠す
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
                    : "すべて"}
              </button>
            </span>
          ))}
        </span>
      </div>

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
              allStagesOpen
                ? "全期間枠を閉じる"
                : "全期間枠を開く"
            }
            className={`timeline-control-button${
              allStagesOpen
                ? " timeline-control-button--closed"
                : ""
            }`}
            data-strong={allStagesOpen ? undefined : "true"}
          >
            {allStagesOpen ? "閉" : "開"}
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
            className={`timeline-control-button${
              allEventsOpen
                ? " timeline-control-button--closed"
                : ""
            }`}
            data-strong={allEventsOpen ? undefined : "true"}
          >
            {allEventsOpen ? "閉" : "開"}
          </button>
        </span>
      </div>
    </div>
  );
}
