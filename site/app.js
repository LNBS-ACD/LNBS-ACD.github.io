/**
 * LNBS-ACD 前端脚本
 * - 首页轮播
 * - 新闻列表分页
 * - 高亮当前导航
 */
(function () {
  "use strict";

  // ---------- 导航高亮 ----------
  (function initNav() {
    var path = location.pathname;
    var links = document.querySelectorAll(".site-nav-link");
    links.forEach(function (a) {
      var href = a.getAttribute("data-nav");
      var match = false;
      if (href === "/" || href === "/index.html") {
        match = path === "/" || path === "/index.html" || path === "";
      } else if (href === "/news.html") {
        match = path.indexOf("/news") === 0;
      } else {
        match = path.indexOf(href) === 0;
      }
      if (match) a.classList.add("is-active");
    });
  })();

  // ---------- 轮播 ----------
  var carousel = document.getElementById("carousel");
  if (carousel) {
    var slides = carousel.querySelectorAll(".carousel-slide");
    var dots = carousel.querySelectorAll(".carousel-dot");
    var idx = 0;
    var total = slides.length;
    var timer = null;

    function show(n) {
      idx = (n + total) % total;
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === idx);
      });
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
      });
    }

    function restart() {
      clearInterval(timer);
      timer = setInterval(function () { show(idx + 1); }, 5000);
    }

    var prevBtn = document.getElementById("carousel-prev");
    var nextBtn = document.getElementById("carousel-next");
    if (prevBtn) prevBtn.addEventListener("click", function () { show(idx - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(idx + 1); restart(); });
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        show(parseInt(d.dataset.index, 10));
        restart();
      });
    });
    restart();
  }

  // ---------- 新闻列表分页 ----------
  var newsList = document.getElementById("news-list");
  if (newsList) {
    fetch("/news.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var pageSize = data.pageSize || 10;
        var items = data.items || [];
        var totalPages = Math.ceil(items.length / pageSize);
        var curPage = 1;

        function render(page) {
          curPage = page;
          var start = (page - 1) * pageSize;
          var slice = items.slice(start, start + pageSize);

          newsList.innerHTML =
            '<div class="news-list">' +
            slice
              .map(function (n) {
                var href = "/news/" + n.date.replace(/-/g, "") + "/p" + n.id + "/";
                return (
                  '<a class="news-item" href="' + href + '">' +
                  '<div class="news-item-body">' +
                  '<p class="news-item-title">' + n.title + "</p>" +
                  '<p class="news-item-summary">' + n.summary + "</p>" +
                  "</div>" +
                  '<span class="news-item-date">' + n.date + "</span>" +
                  "</a>"
                );
              })
              .join("") +
            "</div>";

          // 分页器
          var pager = document.getElementById("news-pager");
          if (pager) {
            var html = "";
            if (page > 1) {
              html += '<button class="pager-btn" data-page="' + (page - 1) + '">&lsaquo;</button>';
            }
            for (var i = 1; i <= totalPages; i++) {
              html +=
                '<button class="pager-btn' +
                (i === page ? " is-active" : "") +
                '" data-page="' +
                i +
                '">' +
                i +
                "</button>";
            }
            if (page < totalPages) {
              html += '<button class="pager-btn" data-page="' + (page + 1) + '">&rsaquo;</button>';
            }
            pager.innerHTML = html;

            pager.querySelectorAll(".pager-btn").forEach(function (btn) {
              btn.addEventListener("click", function () {
                var p = parseInt(btn.dataset.page, 10);
                if (p >= 1 && p <= totalPages) {
                  render(p);
                  history.replaceState(null, "", "#p" + p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              });
            });
          }
        }

        // 从 hash 读取初始页码
        var m = location.hash.match(/^#p(\d+)$/);
        var initPage = m ? Math.min(parseInt(m[1], 10), totalPages) : 1;
        render(initPage);
      })
      .catch(function () {
        newsList.innerHTML = '<p class="text-dim">加载新闻失败。</p>';
      });
  }
})();
