const SUPABASE_URL = "https://khuuuoaomxgabrxxbcgt.supabase.co";
const SUPABASE_KEY = "sb_publishable_NPbWb9gzgTQAr4xHezXt2w_3OajT3xk";

const GITHUB_BASE =
  "https://imamganjnagarpanchayat-dev.github.io/imamganj-jansuchna-manch";

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function getNews(id) {
  const url =
    SUPABASE_URL +
    "/rest/v1/news" +
    "?select=id,title,content,image_url,video_url,location" +
    "&id=eq." +
    encodeURIComponent(id) +
    "&status=eq.published";

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY
    }
  });

  if (!response.ok) return null;

  const data = await response.json();

  return data && data.length ? data[0] : null;
}

export default {
  async fetch(request) {
    const requestUrl = new URL(request.url);
    const newsId = requestUrl.searchParams.get("news");

    // Static files: images, CSS, JS, admin, reporter etc.
    // सीधे GitHub Pages से serve होंगे।
    if (requestUrl.pathname !== "/" && !newsId) {
      const targetUrl =
        GITHUB_BASE + requestUrl.pathname + requestUrl.search;

      return fetch(targetUrl);
    }

    // Main homepage
    const githubPage = GITHUB_BASE + "/index.html";
    const htmlResponse = await fetch(githubPage);

    if (!htmlResponse.ok) {
      return new Response("Website could not be loaded.", {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=UTF-8"
        }
      });
    }

    // Normal homepage without news ID
    if (!newsId) {
      return htmlResponse;
    }

    // News sharing page
    const news = await getNews(newsId);

    if (!news) {
      return htmlResponse;
    }

    let html = await htmlResponse.text();

    const title =
      news.title || "इमामगंज की खबर | जन सूचना मंच";

    const description =
      news.content ||
      "इमामगंज, गया, बिहार की स्थानीय खबरें — जन सूचना मंच";

    const image =
      news.image_url ||
      GITHUB_BASE + "/assets/images/logo.png";

    const shareUrl = requestUrl.href;

    const meta = `
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(shareUrl)}">
<meta property="og:site_name" content="इमामगंज जन सूचना मंच">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">

<meta name="description" content="${esc(description)}">
`;

    html = html.replace("</head>", meta + "\n</head>");

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=60"
      }
    });
  }
};
