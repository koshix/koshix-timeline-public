import { useState } from "react";
import EducationHistoryBlock, {
  educationEditorFont,
} from "./EducationHistoryBlock";
import {
  EARLY_CHILDHOOD_TYPES,
  GRADUATE_TYPES,
  HIGHER_ED_TYPES,
  SECONDARY_ED_TYPES,
  educationForKind,
  normalizeEducationHistory,
  replaceEducationForKind,
} from "./education-history";

const blankEarly = () => ({
  start: "",
  years: "",
  type: "kindergarten",
});

const blankSecondary = () => ({
  start: "",
  years: "",
  type: "highSchool",
});

const blankHigher = () => ({
  start: "",
  years: "",
  type: "university",
});

const blankGraduate = () => ({
  start: "",
  years: "",
  type: "masters",
});

const initialRows = (rows, blankFactory) =>
  Array.isArray(rows) && rows.length > 0
    ? rows.map((row) => ({ ...row }))
    : [blankFactory()];

const compactRows = (rows, types) =>
  normalizeEducationHistory(rows, types, "");

export default function EducationHistoryEditor({
  education,
  onEducationChange,
}) {
  const [earlyRows, setEarlyRows] = useState(() =>
    initialRows(
      educationForKind(education, "early"),
      blankEarly
    )
  );
  const [secondaryRows, setSecondaryRows] = useState(() =>
    initialRows(
      educationForKind(education, "secondary"),
      blankSecondary
    )
  );

  const [higherRows, setHigherRows] = useState(() =>
    initialRows(
      educationForKind(education, "higher"),
      blankHigher
    )
  );
  const [graduateRows, setGraduateRows] = useState(() =>
    initialRows(
      educationForKind(education, "graduate"),
      blankGraduate
    )
  );

  const changeEarlyRows = (next, reset = false) => {
    setEarlyRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "early",
        reset
          ? []
          : compactRows(
              next,
              EARLY_CHILDHOOD_TYPES
            )
      )
    );
  };

  const changeSecondaryRows = (next, reset = false) => {
    setSecondaryRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "secondary",
        reset
          ? []
          : compactRows(
              next,
              SECONDARY_ED_TYPES
            )
      )
    );
  };

  const changeHigherRows = (next, reset = false) => {
    setHigherRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "higher",
        reset
          ? []
          : compactRows(
              next,
              HIGHER_ED_TYPES
            )
      )
    );
  };

  const changeGraduateRows = (next, reset = false) => {
    setGraduateRows(next);
    onEducationChange(
      replaceEducationForKind(
        education,
        "graduate",
        reset
          ? []
          : compactRows(
              next,
              GRADUATE_TYPES
            )
      )
    );
  };

  return (
    <>
      <EducationHistoryBlock
        number={1}
        title="幼稚園・保育所（任意）"
        kind="early"
        rows={earlyRows}
        onRowsChange={changeEarlyRows}
        types={EARLY_CHILDHOOD_TYPES}
        blankFactory={blankEarly}
        color="#b87835"
        soft="#fbefdf"
      />

      <EducationHistoryBlock
        number={2}
        title="高校など（任意）"
        kind="secondary"
        rows={secondaryRows}
        onRowsChange={changeSecondaryRows}
        types={SECONDARY_ED_TYPES}
        blankFactory={blankSecondary}
        color="#1e5fa8"
        soft="#e7f0fb"
      />

      <EducationHistoryBlock
        number={3}
        title="大学など（任意）"
        kind="higher"
        rows={higherRows}
        onRowsChange={changeHigherRows}
        types={HIGHER_ED_TYPES}
        blankFactory={blankHigher}
        color="#6b3fa0"
        soft="#f1e9fa"
      />

      <EducationHistoryBlock
        number={4}
        title="大学院（任意）"
        kind="graduate"
        rows={graduateRows}
        onRowsChange={changeGraduateRows}
        types={GRADUATE_TYPES}
        blankFactory={blankGraduate}
        color="#4a5fb0"
        soft="#eaeefb"
      />

      <div
        style={{
          width: "100%",
          marginTop: 4,
          fontFamily: educationEditorFont,
          fontSize: 10.5,
          lineHeight: 1.7,
          color: "#8a8f98",
        }}
      >
        必要なだけ行を追加できます。中退や編入も実際の修学年数で設定できます。
        高専から大学への編入、修士から博士への進学なども複数行で表せます。
        これで表せない成人後の経歴は下の「5. 成人期」で分割できます。
      </div>
    </>
  );
}
