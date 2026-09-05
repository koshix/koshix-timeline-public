
export default function TimelineDisplayControls({
  controlTargets,
  setAllCats,
  importanceMin,
  setImportanceLevel,
  expandAllStages,
  collapseStages,
  openOnlyEvents,
  closeAllEvents,
  font,
}) {
  return (
    <div
      aria-label="年表表示操作"
      className="timeline-display-controls"
      style={{ "--timeline-font": font }}
    >
      <div
        role="group"
        aria-label="分類の一括表示切替"
        className="timeline-control-group timeline-control-group--categories"
      >
        <span className="timeline-control-label">分類</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={() => setAllCats(true)}
            className="timeline-control-button"
            data-strong="true"
          >
            全ON
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
            全OFF
          </button>
        </span>
      </div>

      <div
        role="group"
        aria-label="表示"
        className="timeline-control-group timeline-control-group--importance"
      >
        <span className="timeline-control-label">表示</span>

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
                  ? "重要"
                  : level === 2
                    ? "標準"
                    : "全部"}
              </button>
            </span>
          ))}
        </span>
      </div>

      <div
        role="group"
        aria-label="期間の一括開閉"
        className="timeline-control-group timeline-control-group--periods"
      >
        <span className="timeline-control-label">期間</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={() => expandAllStages()}
            className="timeline-control-button"
            data-strong="true"
          >
            開
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={() =>
              collapseStages(
                controlTargets.preBirthStageKeys
              )
            }
            title="出生前を閉じ、出生年以降を開きます"
            className="timeline-control-button timeline-control-button--half"
            data-strong="true"
          >
            半
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={() =>
              collapseStages(controlTargets.allStageKeys)
            }
            className="timeline-control-button timeline-control-button--closed"
          >
            閉
          </button>
        </span>
      </div>

      <div
        role="group"
        aria-label="解説の一括開閉"
        className="timeline-control-group timeline-control-group--explanations"
      >
        <span className="timeline-control-label">解説</span>

        <span className="timeline-control-segments">
          <button
            type="button"
            onClick={() =>
              openOnlyEvents(
                controlTargets.allEventIds
              )
            }
            className="timeline-control-button"
            data-strong="true"
          >
            開
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={() =>
              openOnlyEvents(
                controlTargets.birthAndLaterEventIds
              )
            }
            title="出生前の解説を閉じ、出生年以降の解説を開きます"
            className="timeline-control-button timeline-control-button--half"
            data-strong="true"
          >
            半
          </button>

          <span
            aria-hidden="true"
            className="timeline-control-separator"
          />

          <button
            type="button"
            onClick={closeAllEvents}
            className="timeline-control-button timeline-control-button--closed"
          >
            閉
          </button>
        </span>
      </div>
    </div>
  );
}
