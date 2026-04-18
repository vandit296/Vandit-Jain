import React, { useState, useEffect, useCallback } from "react";
import "./TwitterVideoScraper.css";

const SORT_OPTIONS = [
  { value: "desc", label: "Newest First" },
  { value: "asc", label: "Oldest First" },
  { value: "likes", label: "Most Liked" },
  { value: "retweets", label: "Most Retweeted" },
  { value: "views", label: "Most Viewed" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "All Launches" },
  { value: "product", label: "Product Launch" },
  { value: "rocket", label: "Rocket Launch" },
  { value: "app", label: "App Launch" },
  { value: "startup", label: "Startup Launch" },
];

function formatDate(isoString) {
  if (!isoString) return "Unknown date";
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function VideoCard({ tweet }) {
  const [playing, setPlaying] = useState(false);
  const video = tweet.videos?.[0];
  const videoUrl = video?.video_url;
  const thumbnail = video?.preview_image_url;

  return (
    <div className="tws-card">
      <div className="tws-card__media">
        {videoUrl ? (
          playing ? (
            <video
              className="tws-card__video"
              src={videoUrl}
              controls
              autoPlay
              poster={thumbnail}
            />
          ) : (
            <button
              className="tws-card__thumbnail-btn"
              onClick={() => setPlaying(true)}
              aria-label="Play video"
            >
              {thumbnail && (
                <img
                  className="tws-card__thumbnail"
                  src={thumbnail}
                  alt="Video thumbnail"
                />
              )}
              <span className="tws-card__play-icon">▶</span>
            </button>
          )
        ) : (
          thumbnail && (
            <img className="tws-card__thumbnail" src={thumbnail} alt="Video thumbnail" />
          )
        )}
      </div>

      <div className="tws-card__body">
        <div className="tws-card__author">
          {tweet.author?.profile_image_url && (
            <img
              className="tws-card__avatar"
              src={tweet.author.profile_image_url}
              alt={tweet.author.name}
            />
          )}
          <div>
            <span className="tws-card__name">
              {tweet.author?.name || "Unknown"}
              {tweet.author?.verified && (
                <span className="tws-card__verified" title="Verified">✓</span>
              )}
            </span>
            <span className="tws-card__handle">@{tweet.author?.username || "unknown"}</span>
          </div>
        </div>

        <p className="tws-card__text">{tweet.text}</p>

        <div className="tws-card__meta">
          <time className="tws-card__time">{formatDate(tweet.created_at)}</time>
          <div className="tws-card__metrics">
            <span title="Likes">♥ {formatCount(tweet.metrics?.like_count)}</span>
            <span title="Retweets">🔁 {formatCount(tweet.metrics?.retweet_count)}</span>
            <span title="Replies">💬 {formatCount(tweet.metrics?.reply_count)}</span>
            {video?.view_count > 0 && (
              <span title="Views">👁 {formatCount(video.view_count)}</span>
            )}
          </div>
        </div>

        <a
          className="tws-card__link"
          href={tweet.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on X ↗
        </a>
      </div>
    </div>
  );
}

function sortTweets(tweets, order) {
  const arr = [...tweets];
  switch (order) {
    case "asc":
      return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case "desc":
      return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case "likes":
      return arr.sort((a, b) => (b.metrics?.like_count || 0) - (a.metrics?.like_count || 0));
    case "retweets":
      return arr.sort((a, b) => (b.metrics?.retweet_count || 0) - (a.metrics?.retweet_count || 0));
    case "views":
      return arr.sort(
        (a, b) => (b.videos?.[0]?.view_count || 0) - (a.videos?.[0]?.view_count || 0)
      );
    default:
      return arr;
  }
}

function filterTweets(tweets, category) {
  if (category === "all") return tweets;
  return tweets.filter((t) =>
    t.query?.toLowerCase().includes(category) || t.text?.toLowerCase().includes(category)
  );
}

export default function TwitterVideoScraper({ dataUrl = "/output/launch_videos.json" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 12;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(dataUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dataUrl]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tweets = data?.tweets || [];

  const visible = sortTweets(
    filterTweets(
      tweets.filter((t) =>
        searchText
          ? t.text?.toLowerCase().includes(searchText.toLowerCase()) ||
            t.author?.username?.toLowerCase().includes(searchText.toLowerCase()) ||
            t.author?.name?.toLowerCase().includes(searchText.toLowerCase())
          : true
      ),
      filterCategory
    ),
    sortOrder
  );

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const paginated = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSortChange = (val) => {
    setSortOrder(val);
    setPage(1);
  };
  const handleFilterChange = (val) => {
    setFilterCategory(val);
    setPage(1);
  };
  const handleSearch = (e) => {
    setSearchText(e.target.value);
    setPage(1);
  };

  return (
    <div className="tws">
      <header className="tws__header">
        <h1 className="tws__title">
          <span className="tws__x-icon">𝕏</span> Launch Video Timeline
        </h1>
        {data && (
          <p className="tws__subtitle">
            {data.total} videos · Updated {formatDate(data.generated_at)}
          </p>
        )}
      </header>

      <div className="tws__toolbar">
        <input
          className="tws__search"
          type="search"
          placeholder="Search tweets, authors…"
          value={searchText}
          onChange={handleSearch}
        />

        <div className="tws__controls">
          <label className="tws__label">
            Category
            <select
              className="tws__select"
              value={filterCategory}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="tws__label">
            Sort by
            <select
              className="tws__select"
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button className="tws__refresh" onClick={loadData} title="Refresh data">
            ↺ Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="tws__state">
          <div className="tws__spinner" />
          <p>Loading launch videos…</p>
        </div>
      )}

      {error && (
        <div className="tws__state tws__state--error">
          <p>⚠ Failed to load data: {error}</p>
          <p className="tws__hint">
            Run the Python scraper first: <code>python twitter_scraper/scraper.py</code>
            , then copy <code>twitter_scraper/output/launch_videos.json</code> to{" "}
            <code>public/output/</code>.
          </p>
          <button className="tws__refresh" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="tws__state">
          <p>No videos match your filters.</p>
        </div>
      )}

      {!loading && !error && paginated.length > 0 && (
        <>
          <p className="tws__count">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visible.length)} of{" "}
            {visible.length} results
          </p>

          <div className="tws__grid">
            {paginated.map((tweet) => (
              <VideoCard key={tweet.id} tweet={tweet} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="tws__pagination">
              <button
                className="tws__page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - page) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    className={`tws__page-btn ${p === page ? "tws__page-btn--active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                className="tws__page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
