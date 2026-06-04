(function () {
  function applyBingBackground(imageUrl) {
    var backdrop = document.getElementById("backdrop");
    if (!backdrop) return;
    backdrop.style.backgroundImage = "url('" + imageUrl + "')";
    requestAnimationFrame(function () {
      backdrop.classList.add("is-loaded");
    });
  }

  function loadBingWallpaper() {
    var indexName = "bing-image-index";
    var index = parseInt(sessionStorage.getItem(indexName), 10);
    if (isNaN(index) || index >= 7) index = 0;
    else index += 1;
    sessionStorage.setItem(indexName, String(index));

    var bg =
      "https://bing.img.run/rand.php?idx=" + index + "&_=" + Date.now();
    applyBingBackground(bg);
  }

  function loadHitokoto() {
    var quote = document.getElementById("description");
    var from = document.getElementById("hitokoto-from");
    if (!quote) return;

    fetch("https://v1.hitokoto.cn")
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        quote.textContent = res.hitokoto;
        if (from) from.textContent = "—「" + res.from + "」";
      })
      .catch(function () {});
  }

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el, i) {
      el.style.setProperty("--d", String(i % 12));
      observer.observe(el);
    });
  }

  function initAvatar() {
    var img = document.querySelector(".js-avatar");
    if (!img) return;
    function ready() {
      img.classList.add("is-ready");
    }
    if (img.complete) ready();
    else img.addEventListener("load", ready);
  }

  function isMobileUi() {
    return window.matchMedia(
      "(max-width: 768px), (hover: none) and (pointer: coarse)"
    ).matches;
  }

  function initFx() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!document.querySelector(".fx-ambient")) {
      var layer = document.createElement("div");
      layer.className = "fx-ambient";
      layer.setAttribute("aria-hidden", "true");
      layer.innerHTML =
        '<div class="fx-orb fx-orb-a"></div>' +
        '<div class="fx-orb fx-orb-b"></div>' +
        '<div class="fx-orb fx-orb-c"></div>' +
        '<div class="fx-grid"></div>' +
        '<div class="fx-spotlight fx-spotlight--lag"></div>' +
        '<div class="fx-spotlight"></div>';
      var backdrop = document.getElementById("backdrop");
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.insertBefore(layer, backdrop.nextSibling);
      } else {
        document.body.prepend(layer);
      }
    }

    if (!isMobileUi()) {
      initPointerFx();
      var ambient = document.querySelector(".fx-ambient");
      if (ambient) ambient.classList.add("fx-ambient--interactive");
    }
  }

  function initPointerFx() {
    var ring = document.createElement("div");
    ring.className = "fx-cursor-ring";
    var dot = document.createElement("div");
    dot.className = "fx-cursor-dot";
    var trailCanvas = document.createElement("canvas");
    trailCanvas.className = "fx-trail-canvas";
    trailCanvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.appendChild(trailCanvas);
    document.body.classList.add("has-pointer-fx");

    var trailCtx = trailCanvas.getContext("2d");
    var trailPoints = [];
    var dpr = 1;

    var orbA = document.querySelector(".fx-orb-a");
    var orbB = document.querySelector(".fx-orb-b");
    var pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      smoothX: window.innerWidth * 0.5,
      smoothY: window.innerHeight * 0.5,
      lagX: window.innerWidth * 0.5,
      lagY: window.innerHeight * 0.5,
    };

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function resizeTrailCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      trailCanvas.width = Math.floor(window.innerWidth * dpr);
      trailCanvas.height = Math.floor(window.innerHeight * dpr);
      trailCanvas.style.width = window.innerWidth + "px";
      trailCanvas.style.height = window.innerHeight + "px";
      trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resizeTrailCanvas();
    window.addEventListener("resize", resizeTrailCanvas);

    function pushTrailPoint(x, y) {
      var last = trailPoints[trailPoints.length - 1];
      if (last && Math.hypot(x - last.x, y - last.y) < 3) return;
      trailPoints.push({ x: x, y: y, life: 1 });
      if (trailPoints.length > 56) trailPoints.shift();
    }

    function drawTrailLine() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      trailCtx.clearRect(0, 0, w, h);

      for (var i = trailPoints.length - 1; i >= 0; i--) {
        trailPoints[i].life -= 0.022;
        if (trailPoints[i].life <= 0) trailPoints.splice(i, 1);
      }

      if (trailPoints.length < 2) return;

      for (var j = 1; j < trailPoints.length; j++) {
        var p0 = trailPoints[j - 1];
        var p1 = trailPoints[j];
        var a0 = p0.life;
        var a1 = p1.life;

        trailCtx.beginPath();
        trailCtx.moveTo(p0.x, p0.y);
        trailCtx.lineTo(p1.x, p1.y);
        trailCtx.lineCap = "round";
        trailCtx.lineJoin = "round";
        trailCtx.lineWidth = 1.2 + a1 * 2.8;
        trailCtx.strokeStyle =
          "rgba(34, 181, 115, " + Math.min(a0, a1) * 0.85 + ")";
        trailCtx.shadowColor = "rgba(126, 232, 255, 0.9)";
        trailCtx.shadowBlur = 10 * a1;
        trailCtx.stroke();
        trailCtx.shadowBlur = 0;
      }
    }

    function bindGlow(el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = ((e.clientX - r.left) / r.width) * 100;
        var py = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--px", px + "%");
        el.style.setProperty("--py", py + "%");
      });
    }

    document.querySelectorAll("a.bento-item, .link-tile").forEach(function (el) {
      el.setAttribute("data-tilt", "");
      bindGlow(el);
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(900px) rotateY(" +
          x * 14 +
          "deg) rotateX(" +
          -y * 14 +
          "deg) translateY(-5px) scale(1.02)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });

    document.querySelectorAll(".nav-pill, .topbar-brand").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        ring.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", function () {
        ring.classList.remove("is-hover");
        el.style.transform = "";
      });
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.2;
        var y = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform =
          "translate(" + x + "px, " + y + "px)";
      });
    });

    document.addEventListener(
      "mousemove",
      function (e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pushTrailPoint(e.clientX, e.clientY);
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", function () {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    });

    document.addEventListener("mouseenter", function () {
      ring.style.opacity = "1";
      dot.style.opacity = "1";
    });

    function tick() {
      pointer.smoothX = lerp(pointer.smoothX, pointer.x, 0.14);
      pointer.smoothY = lerp(pointer.smoothY, pointer.y, 0.14);
      pointer.lagX = lerp(pointer.lagX, pointer.x, 0.06);
      pointer.lagY = lerp(pointer.lagY, pointer.y, 0.06);

      ring.style.transform =
        "translate3d(" +
        pointer.smoothX +
        "px," +
        pointer.smoothY +
        "px,0) translate(-50%,-50%)";
      dot.style.transform =
        "translate3d(" +
        pointer.x +
        "px," +
        pointer.y +
        "px,0) translate(-50%,-50%)";

      document.documentElement.style.setProperty(
        "--mx",
        pointer.smoothX + "px"
      );
      document.documentElement.style.setProperty(
        "--my",
        pointer.smoothY + "px"
      );
      document.documentElement.style.setProperty("--mx-lag", pointer.lagX + "px");
      document.documentElement.style.setProperty("--my-lag", pointer.lagY + "px");

      if (orbA) {
        var ox = (pointer.x / window.innerWidth - 0.5) * 36;
        var oy = (pointer.y / window.innerHeight - 0.5) * 28;
        orbA.style.transform = "translate(" + ox + "px, " + oy + "px)";
      }
      if (orbB) {
        var ox2 = (pointer.x / window.innerWidth - 0.5) * -24;
        var oy2 = (pointer.y / window.innerHeight - 0.5) * -20;
        orbB.style.transform = "translate(" + ox2 + "px, " + oy2 + "px)";
      }

      drawTrailLine();
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadBingWallpaper();
    loadHitokoto();
    initFx();
    initReveal();
    initAvatar();
  });
})();
