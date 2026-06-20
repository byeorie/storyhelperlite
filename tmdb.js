// TMDB API 연동
const TMDB_KEY = "cd6415b1f647445096c926d2408b8d9e";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

// 장르 매핑 (앱 장르 → TMDB 장르 ID)
const GENRE_MAP = {
  "판타지": 14, "SF": 878, "로맨스": 10749, "액션": 28,
  "스릴러": 53, "미스터리": 9648, "공포": 27, "드라마": 18,
  "코미디": 35, "역사": 36, "애니메이션": 16, "범죄": 80
};

// 미국(840), 한국(410), 일본(392)
const TARGET_COUNTRIES = "840|410|392";

async function tmdbFetch(path, params={}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "ko-KR");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  return r.ok ? r.json() : null;
}

// 영화 카드 HTML 생성
function movieCard(m) {
  const poster = m.poster_path
    ? `<img src="${TMDB_IMG}${m.poster_path}" alt="${m.title}" style="width:60px;border-radius:6px;flex-shrink:0">`
    : `<div style="width:60px;height:90px;background:var(--accent2);border-radius:6px;flex-shrink:0"></div>`;
  const year = m.release_date ? m.release_date.slice(0,4) : "";
  const score = m.vote_average ? `⭐ ${m.vote_average.toFixed(1)}` : "";
  return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)">
    ${poster}
    <div>
      <div style="font-weight:700;font-size:14px">${m.title} ${year ? `<span style="font-weight:400;color:var(--muted);font-size:12px">(${year})</span>` : ""}</div>
      <div style="font-size:12px;color:var(--muted);margin:2px 0">${score}${m.original_title !== m.title ? " · " + m.original_title : ""}</div>
      <div style="font-size:13px;color:var(--ink);margin-top:4px;line-height:1.5">${(m.overview||"").slice(0,120)}${m.overview&&m.overview.length>120?"…":""}</div>
    </div>
  </div>`;
}

// 장르 기반 유사작 검색 (미국·한국·일본, 로그라인 있는 작품만)
async function findSimilarMovies(idea, box) {
  box.className = "ai-box";
  box.innerHTML = `<span class="spinner"></span> 유사 작품을 검색 중…`;

  const genreId = GENRE_MAP[idea.genre] || "";
  const params = {
    sort_by: "popularity.desc",
    "vote_count.gte": 50,
    with_origin_country: TARGET_COUNTRIES,
    without_keywords: "210024",  // 성인 콘텐츠 제외
  };
  if (genreId) params.with_genres = genreId;

  try {
    // 2페이지 가져와서 overview 있는 것만 필터링 후 5개 표시
    const [d1, d2] = await Promise.all([
      tmdbFetch("/discover/movie", { ...params, page: 1 }),
      tmdbFetch("/discover/movie", { ...params, page: 2 }),
    ]);

    const all = [
      ...(d1?.results || []),
      ...(d2?.results || []),
    ].filter(m => m.overview && m.overview.trim().length > 20);

    if (!all.length) {
      box.innerHTML = "검색 결과가 없습니다. 장르를 선택해보세요.";
      return;
    }

    const movies = all.slice(0, 5);
    const genreLabel = idea.genre || "전체";
    box.innerHTML =
      `<div style="font-weight:700;margin-bottom:8px">📽 [${genreLabel}] 미국·한국·일본 인기작 TOP 5</div>` +
      movies.map(movieCard).join("") +
      `<div style="margin-top:10px;font-size:12px;color:var(--muted)">출처: TMDB (themoviedb.org)</div>`;
  } catch(e) {
    box.innerHTML = "검색 중 오류가 발생했습니다.";
  }
}
