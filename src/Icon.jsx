const ICON_NAMES = new Set([
  "book", "tv", "film", "robot", "watch",
  "comm", "computer", "chip", "globe", "satellite",
  "rocket", "hmd", "gamepad", "phone", "video",
  "ai", "ghost", "music", "wifi", "flag",
]);

export default function Icon({ name, color, size = 18 }) {
  const iconName = ICON_NAMES.has(name) ? name : "book";

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
      aria-hidden="true"
    >
      <use href={`${import.meta.env.BASE_URL}icons.svg#icon-${iconName}`} />
    </svg>
  );
}
