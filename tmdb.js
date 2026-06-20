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

async function tmdbFetch(path, params={}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "ko-KR");
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  return r.ok ? r.json() : null;
}

// 장르 ID로 유사 영화 검색
async function findSimilarByGenre(genreName, page=1) {
  const genreId = GENRE_MAP[genreName];
  const params = { sort_by: "popularity.desc", page };
  if (genreId) params.with_genres = genreId;
  return tmdbFetch("/discover/movie", params);
}

// 키워드로 영화 검색
async function searchMovies(query) {
  return tmdbFetch("/search/movie", { query });
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
      <div style="font-size:13px;color:var(--ink);margin-top:4px;line-height:1.5">${(m.overview||"줄거리 정보 없음").slice(0,120)}${m.overview&&m.overview.length>120?"…":""}</div>
    </div>
  </div>`;
}

// 아이디어 탭: 장르 기반 유사작 검색
async function findSimilarMovies(idea, box) {
  box.className = "ai-box";
  box.innerHTML = `<span class="spinner"></span> 유사 작품을 검색 중…`;

  const genre = idea.genre || "";
  try {
    const data = await findSimilarByGenre(genre);
    if (!data || !data.results || !data.results.length) {
      box.innerHTML = "검색 결과가 없습니다.";
      return;
    }
    const movies = data.results.slice(0, 5);
    const genreLabel = genre || "전체";
    box.innerHTML = `<div style="font-weight:700;margin-bottom:8px">📽 [${genreLabel}] 장르 인기작 TOP 5</div>`
      + movies.map(movieCard).join("")
      + `<div style="margin-top:10px;font-size:12px;color:var(--muted)">출처: TMDB (themoviedb.org)</div>`;
  } catch(e) {
    box.innerHTML = "검색 중 오류가 발생했습니다.";
  }
}
