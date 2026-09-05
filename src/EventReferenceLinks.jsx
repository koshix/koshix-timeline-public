import { buildWikipediaQuery } from "./event-reference-query.js";

export default function EventReferenceLinks({
  title,
  query,
  links,
  color,
}) {
  const wikipediaQuery =
    buildWikipediaQuery(title, query);

  return (
    <>
      {(wikipediaQuery || query) && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {wikipediaQuery && (
          <a
            href={`https://ja.wikipedia.org/w/index.php?search=${encodeURIComponent(wikipediaQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              borderRadius: 999,
              padding: "3px 12px",
              background: "#b0771e",
            }}
          >
            Wikipediaで探す
          </a>
          )}

          {query && (
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#fff",
              textDecoration: "none",
              borderRadius: 999,
              padding: "3px 12px",
              background: "#c2452d",
            }}
          >
            YouTubeで探す
          </a>
          )}
        </div>
      )}

      {links && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {links.map((item) => {
            // TSVでは "|" をソース間の区切りに使うので、
            // 1ソース内の「対象::表示名」は "::" で分ける。
            // 外部URLは "https://…::表示名"、Wikipediaは "記事名::表示名"。
            const [rawTarget, rawLabel] = item.split("::");
            const external = rawTarget.startsWith("http");
            const english = rawTarget.startsWith("en:");
            const article = english
              ? rawTarget.slice(3)
              : rawTarget;
            const title =
              rawLabel ||
              (external ? rawTarget : article);
            const url = external
              ? rawTarget
              : (english
                  ? "https://en.wikipedia.org/wiki/"
                  : "https://ja.wikipedia.org/wiki/") +
                encodeURIComponent(
                  article.replace(/ /g, "_")
                );

            return (
              <a
                key={item}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color,
                  textDecoration: "none",
                  border: `1px solid ${color}44`,
                  borderRadius: 999,
                  padding: "2px 10px",
                  background: "#ffffffaa",
                }}
              >
                {external ? "▶ " : "W: "}
                {title}
                {english ? " (en)" : ""}
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
