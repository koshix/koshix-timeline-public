const ICON_NAMES = new Set([
  "book", "tv", "film", "robot",
  "watch", "comm", "computer", "chip",
  "globe", "satellite", "rocket", "hmd",
  "gamepad", "phone", "video", "ai",
  "ghost", "legacy-music", "wifi", "flag",
  "politics-japan", "politics-world", "literature-japan", "literature-world",
  "rights-expand", "rights-suppress", "technology-innovation", "technology-implementation",
  "matter-physics", "matter-material", "war", "visual-work",
  "visual-media", "economy", "music", "life-science",
  "life-health", "thought", "space", "environment",
  "art", "math", "revolution", "fallback-work",
  "fallback-science", "fallback-education", "fallback-computer", "fallback-culture",
  "fallback-society",
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
