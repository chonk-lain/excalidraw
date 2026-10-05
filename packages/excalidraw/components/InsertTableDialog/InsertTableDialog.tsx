import { useState } from "react";

import { t } from "../../i18n";
import { useUIAppState } from "../../context/ui-appState";
import { useApp } from "../App";
import { CheckboxItem } from "../CheckboxItem";
import { Dialog } from "../Dialog";
import { FilledButton } from "../FilledButton";
import { TextField } from "../TextField";

import {
  generateTableElements,
  normalizeTableOptions,
  TABLE_MAX_CELLS_PER_AXIS,
} from "./generateTable";

import "./InsertTableDialog.scss";

import type { TableOptions } from "./generateTable";

const PREVIEW_SIZE = 220;

type NumericField = Exclude<keyof TableOptions, "locked">;

const FIELDS = [
  { key: "rows", label: "insertTableDialog.rows" },
  { key: "columns", label: "insertTableDialog.columns" },
  { key: "width", label: "insertTableDialog.width" },
  { key: "height", label: "insertTableDialog.height" },
  { key: "cellSpacing", label: "insertTableDialog.cellSpacing" },
  { key: "cornerRadius", label: "insertTableDialog.cornerRadius" },
] as const;

const DEFAULT_VALUES: Record<NumericField, string> = {
  rows: "3",
  columns: "3",
  width: "300",
  height: "150",
  cellSpacing: "5",
  cornerRadius: "20",
};

const TablePreview = ({ options }: { options: TableOptions }) => {
  const { rows, columns, width, height, cellSpacing, cornerRadius } = options;
  const scale = PREVIEW_SIZE / Math.max(width, height);
  const cellWidth = ((width - (columns - 1) * cellSpacing) / columns) * scale;
  const cellHeight = ((height - (rows - 1) * cellSpacing) / rows) * scale;
  const radius = Math.min(cornerRadius * scale, cellWidth / 4, cellHeight / 4);

  return (
    <svg
      className="InsertTableDialog__preview"
      width={width * scale}
      height={height * scale}
      viewBox={`-1 -1 ${width * scale + 2} ${height * scale + 2}`}
    >
      {Array.from({ length: rows * columns }, (_, index) => (
        <rect
          key={index}
          x={(index % columns) * (cellWidth + cellSpacing * scale)}
          y={Math.floor(index / columns) * (cellHeight + cellSpacing * scale)}
          width={cellWidth}
          height={cellHeight}
          rx={radius}
        />
      ))}
    </svg>
  );
};

export const InsertTableDialog = ({ onClose }: { onClose: () => void }) => {
  const app = useApp();
  const appState = useUIAppState();
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [resizable, setResizable] = useState(true);

  const options = normalizeTableOptions({
    rows: parseFloat(values.rows),
    columns: parseFloat(values.columns),
    width: parseFloat(values.width),
    height: parseFloat(values.height),
    cellSpacing: parseFloat(values.cellSpacing),
    cornerRadius: parseFloat(values.cornerRadius),
    locked: !resizable,
  });

  const onInsert = () => {
    app.onInsertElements(generateTableElements(options, appState));
    onClose();
    app.focusContainer();
  };

  return (
    <Dialog
      size="small"
      onCloseRequest={onClose}
      title={t("insertTableDialog.title")}
      className="InsertTableDialog"
    >
      <div className="InsertTableDialog__form">
        <div className="InsertTableDialog__fields">
          {FIELDS.map(({ key, label }, index) => (
            <TextField
              key={key}
              className={`InsertTableDialog__field--${key}`}
              type="number"
              label={t(label)}
              value={values[key]}
              selectOnRender={index === 0}
              onChange={(value) =>
                setValues((prev) => ({ ...prev, [key]: value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onInsert();
                }
              }}
            />
          ))}
        </div>
        <CheckboxItem
          className="InsertTableDialog__resizable"
          checked={resizable}
          onChange={setResizable}
        >
          {t("insertTableDialog.allowResize")}
        </CheckboxItem>
        <div className="InsertTableDialog__previewWrapper">
          <TablePreview options={options} />
        </div>
        <div className="InsertTableDialog__hint">
          {t("insertTableDialog.maxCells", { max: TABLE_MAX_CELLS_PER_AXIS })}
        </div>
        <div className="InsertTableDialog__actions">
          <FilledButton
            className="InsertTableDialog__insert"
            label={t("insertTableDialog.insert")}
            onClick={onInsert}
          />
        </div>
      </div>
    </Dialog>
  );
};
