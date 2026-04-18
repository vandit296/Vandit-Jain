"""
Twitter/X Launch Video Scraper
Searches for launch-related videos on X (Twitter) and sorts them by timeline.

Requirements:
    pip install -r requirements.txt

Usage:
    python scraper.py --query "product launch" --max-results 100
    python scraper.py --query "rocket launch" --days 7 --output results.json
    python scraper.py  # uses default queries
"""

import os
import json
import argparse
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import tweepy
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

DEFAULT_QUERIES = [
    "product launch has:videos -is:retweet lang:en",
    "rocket launch has:videos -is:retweet lang:en",
    "app launch has:videos -is:retweet lang:en",
    "startup launch has:videos -is:retweet lang:en",
    "#launch has:videos -is:retweet lang:en",
]

TWEET_FIELDS = [
    "id",
    "text",
    "author_id",
    "created_at",
    "public_metrics",
    "attachments",
    "entities",
    "lang",
    "possibly_sensitive",
]

USER_FIELDS = [
    "id",
    "name",
    "username",
    "profile_image_url",
    "verified",
    "public_metrics",
]

MEDIA_FIELDS = [
    "media_key",
    "type",
    "url",
    "preview_image_url",
    "duration_ms",
    "public_metrics",
    "variants",
]

EXPANSIONS = [
    "author_id",
    "attachments.media_keys",
]


def build_client() -> tweepy.Client:
    bearer = os.getenv("TWITTER_BEARER_TOKEN")
    if not bearer:
        raise EnvironmentError(
            "TWITTER_BEARER_TOKEN not set. Copy .env.example to .env and add your token."
        )
    return tweepy.Client(bearer_token=bearer, wait_on_rate_limit=True)


def extract_video_url(media_variants: list) -> Optional[str]:
    """Return the highest-bitrate mp4 variant URL from a video media item."""
    mp4s = [v for v in media_variants if v.get("content_type") == "video/mp4"]
    if not mp4s:
        return None
    best = max(mp4s, key=lambda v: v.get("bit_rate", 0))
    return best.get("url")


def scrape_query(
    client: tweepy.Client,
    query: str,
    max_results: int = 100,
    days_back: int = 7,
) -> list[dict]:
    """Run a single search query and return normalised tweet records."""
    start_time = datetime.now(timezone.utc) - timedelta(days=days_back)

    results = []
    paginator = tweepy.Paginator(
        client.search_recent_tweets,
        query=query,
        tweet_fields=TWEET_FIELDS,
        user_fields=USER_FIELDS,
        media_fields=MEDIA_FIELDS,
        expansions=EXPANSIONS,
        start_time=start_time,
        max_results=min(max_results, 100),
    ).flatten(limit=max_results)

    users_map: dict[str, dict] = {}
    media_map: dict[str, dict] = {}

    for tweet in paginator:
        # tweepy.Paginator.flatten gives us Tweet objects; we need includes separately
        results.append(tweet)

    # Re-fetch with includes to get user / media data
    raw_pages = tweepy.Paginator(
        client.search_recent_tweets,
        query=query,
        tweet_fields=TWEET_FIELDS,
        user_fields=USER_FIELDS,
        media_fields=MEDIA_FIELDS,
        expansions=EXPANSIONS,
        start_time=start_time,
        max_results=min(max_results, 100),
    )

    tweet_objs: list = []
    for page in raw_pages:
        if page.data:
            tweet_objs.extend(page.data)
        if page.includes:
            for u in page.includes.get("users", []):
                users_map[u.id] = {
                    "id": u.id,
                    "name": u.name,
                    "username": u.username,
                    "profile_image_url": getattr(u, "profile_image_url", None),
                    "verified": getattr(u, "verified", False),
                    "followers_count": (
                        u.public_metrics.get("followers_count", 0)
                        if hasattr(u, "public_metrics") and u.public_metrics
                        else 0
                    ),
                }
            for m in page.includes.get("media", []):
                variants = []
                if hasattr(m, "variants") and m.variants:
                    variants = [
                        {
                            "content_type": v.get("content_type", ""),
                            "url": v.get("url", ""),
                            "bit_rate": v.get("bit_rate", 0),
                        }
                        for v in m.variants
                    ]
                media_map[m.media_key] = {
                    "media_key": m.media_key,
                    "type": m.type,
                    "url": getattr(m, "url", None),
                    "preview_image_url": getattr(m, "preview_image_url", None),
                    "duration_ms": getattr(m, "duration_ms", None),
                    "view_count": (
                        m.public_metrics.get("view_count", 0)
                        if hasattr(m, "public_metrics") and m.public_metrics
                        else 0
                    ),
                    "variants": variants,
                    "video_url": extract_video_url(variants),
                }
        if len(tweet_objs) >= max_results:
            break

    normalized: list[dict] = []
    for t in tweet_objs[:max_results]:
        media_keys = []
        if hasattr(t, "attachments") and t.attachments:
            media_keys = t.attachments.get("media_keys", [])

        media_items = [media_map[k] for k in media_keys if k in media_map]
        video_media = [m for m in media_items if m["type"] in ("video", "animated_gif")]

        if not video_media:
            continue

        author = users_map.get(t.author_id, {})
        metrics = t.public_metrics or {}

        normalized.append(
            {
                "id": t.id,
                "text": t.text,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "author": author,
                "metrics": {
                    "like_count": metrics.get("like_count", 0),
                    "retweet_count": metrics.get("retweet_count", 0),
                    "reply_count": metrics.get("reply_count", 0),
                    "quote_count": metrics.get("quote_count", 0),
                },
                "videos": video_media,
                "tweet_url": f"https://twitter.com/i/web/status/{t.id}",
                "query": query,
            }
        )

    log.info("Query '%s' → %d video tweets found", query, len(normalized))
    return normalized


def deduplicate(tweets: list[dict]) -> list[dict]:
    seen: set = set()
    unique = []
    for t in tweets:
        if t["id"] not in seen:
            seen.add(t["id"])
            unique.append(t)
    return unique


def sort_by_timeline(tweets: list[dict], order: str = "desc") -> list[dict]:
    """Sort tweets chronologically. order='desc' = newest first."""
    reverse = order == "desc"
    return sorted(
        tweets,
        key=lambda t: t["created_at"] or "",
        reverse=reverse,
    )


def run(
    queries: list[str],
    max_results: int,
    days_back: int,
    output_path: str,
    sort_order: str,
) -> None:
    client = build_client()
    all_tweets: list[dict] = []

    for q in queries:
        log.info("Searching: %s", q)
        try:
            tweets = scrape_query(client, q, max_results=max_results, days_back=days_back)
            all_tweets.extend(tweets)
        except tweepy.TooManyRequests:
            log.warning("Rate limited on query '%s', skipping.", q)
        except tweepy.TwitterServerError as exc:
            log.error("Twitter API error on '%s': %s", q, exc)

    all_tweets = deduplicate(all_tweets)
    all_tweets = sort_by_timeline(all_tweets, order=sort_order)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(all_tweets),
        "sort_order": sort_order,
        "queries": queries,
        "tweets": all_tweets,
    }

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    log.info("Saved %d tweets to %s", len(all_tweets), output_path)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Scrape launch videos from X (Twitter)")
    p.add_argument(
        "--query",
        action="append",
        dest="queries",
        help="Search query (can repeat). Defaults to built-in launch queries.",
    )
    p.add_argument(
        "--max-results",
        type=int,
        default=100,
        help="Max results per query (default: 100)",
    )
    p.add_argument(
        "--days",
        type=int,
        default=7,
        help="How many days back to search (default: 7, max: 7 for free tier)",
    )
    p.add_argument(
        "--output",
        default="output/launch_videos.json",
        help="Output JSON file path (default: output/launch_videos.json)",
    )
    p.add_argument(
        "--sort",
        choices=["asc", "desc"],
        default="desc",
        help="Timeline sort order: desc=newest first, asc=oldest first (default: desc)",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    queries = args.queries if args.queries else DEFAULT_QUERIES
    run(
        queries=queries,
        max_results=args.max_results,
        days_back=args.days,
        output_path=args.output,
        sort_order=args.sort,
    )
