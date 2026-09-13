import {
  PUBLIC_EVENT_ICON_NAMES,
} from "./event-icon.js";

const ICON_NAMES = new Set([
  ...PUBLIC_EVENT_ICON_NAMES,
  "flag",
]);

export default function Icon({ name, color, size = 18 }) {
  const iconName = ICON_NAMES.has(name) ? name : "fallback-work";

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      color={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
      aria-hidden="true"
    >
      <use
        href={`${import.meta.env.BASE_URL}icons.svg#icon-${iconName}`}
        width="100%"
        height="100%"
      />
    </svg>
  );
}
