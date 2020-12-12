// Hide Header on on scroll down
var didScroll;
var lastScrollTop = 0;
var delta = 5;
var navbarHeight = $("header").outerHeight();
var btn = $("#but-to-up");

// Blur Image
const blurryImageLoad = new BlurryImageLoad();

// For Typing Text
const TxtRotate = function (el, toRotate, period) {
  this.toRotate = toRotate;
  this.el = el;
  this.loopNum = 0;
  this.period = parseInt(period, 10) || 2000;
  this.txt = "";
  this.tick();
  this.isDeleting = false;
};

TxtRotate.prototype.tick = function () {
  var i = this.loopNum % this.toRotate.length;
  var fullTxt = this.toRotate[i];

  if (this.isDeleting) {
    this.txt = fullTxt.substring(0, this.txt.length - 1);
  } else {
    this.txt = fullTxt.substring(0, this.txt.length + 1);
  }

  this.el.innerHTML = '<span class="wrap">' + this.txt + "</span>";

  var that = this;
  var delta = 300 - Math.random() * 100;

  if (this.isDeleting) {
    delta /= 2;
  }

  if (!this.isDeleting && this.txt === fullTxt) {
    delta = this.period;
    if (this.txt == "/AnbiDev/") {
      delta = 30000;
    }

    this.isDeleting = true;
  } else if (this.isDeleting && this.txt === "") {
    this.isDeleting = false;
    this.loopNum++;
    delta = 500;
  }

  setTimeout(function () {
    that.tick();
  }, delta);
};

// execute after all in load
$(function () {
  // For typing Title
  var elements = document.getElementsByClassName("logo__text");
  console.log(elements);
  for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute("data-rotate");
    var period = elements[i].getAttribute("data-period");
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
});

$(window).scroll(function (event) {
  didScroll = true;
  if ($(window).scrollTop() > 300) {
    btn.addClass("show");
  } else {
    btn.removeClass("show");
  }
});

btn.on("click", function (e) {
  e.preventDefault();
  $("html, body").animate({ scrollTop: 0 }, "300");
});

setInterval(function () {
  if (didScroll) {
    hasScrolled();
    didScroll = false;
  }
}, 100);

function hasScrolled() {
  var st = $(this).scrollTop();

  // Make sure they scroll more than delta
  if (Math.abs(lastScrollTop - st) <= delta) return;

  // If they scrolled down and are past the navbar, add class .nav-up.
  // This is necessary so you never see what is "behind" the navbar.
  if (st > lastScrollTop && st > navbarHeight) {
    // Scroll Down
    $("header").removeClass("nav-down").addClass("nav-up");
  } else {
    // Scroll Up
    if (st + $(window).height() < $(document).height()) {
      $("header").removeClass("nav-up").addClass("nav-down");
    }
  }

  lastScrollTop = st;
}

window.addEventListener("DOMContentLoaded", function(event)
{
  var index = null;
  var lookup = null;
  var queuedTerm = null;

  var form = document.getElementById("search-form");
  var input = document.getElementById("search-input");

  $('a[href="#search"]').on("click", function (event) {
    event.preventDefault();
    
    $("#search").addClass("open");
    $('#search-input').focus();
  });

  
  $("#search, #search button.close").on("click", function (event) {
    if (event.target == this || event.target.className == "close") {
      $(this).removeClass("open");
    }
  });

  form.addEventListener("submit", function(event)
  {
    event.preventDefault();
    var term = input.value.trim();
    if (!term)
      return;

    startSearch(term);
  }, false);

  function startSearch(term)
  {
    // Start icon animation.
    $(".search-form").hide();
    $(".loop").show();
    
    if (index)
    {
      // Index already present, search directly.
      search(term);
    }
    else if (queuedTerm)
    {
      // Index is being loaded, replace the term we want to search for.
      queuedTerm = term;
    }
    else
    {
      // Start loading index, perform the search when done.
      queuedTerm = term;
      initIndex();
    }
  }

  function searchDone()
  {
    // Stop icon animation.
    $("#search").removeClass("open");
    $(".search-form").show();
    $(".loop").hide();
    queuedTerm = null;
  }

  function initIndex()
  {
    var request = new XMLHttpRequest();
    request.open("GET", "/search.json");
    request.responseType = "json";
    request.addEventListener("load", function(event)
    {
      lookup = {};
      index = lunr(function()
      {
        // Uncomment the following line and replace de by the right language
        // code to use a lunr language pack.

        // this.use(lunr.de);

        this.ref("url");

        // If you added more searchable fields to the search index, list them here.
        this.field("title");
        this.field("content");
        this.field("description");
        this.field("categories");

        for (var doc of request.response)
        {
          this.add(doc);
          lookup[doc.url] = doc;
        }
      });

      // Search index is ready, perform the search now
      search(queuedTerm);
    }, false);

    request.addEventListener("error", searchDone, false);
    request.send(null);
  }

  function search(term)
  {
    var results = index.search(term);

    // The element where search results should be displayed, adjust as needed.
    var target = document.querySelector(".content");

    while (target.firstChild)
      target.removeChild(target.firstChild);

    var title = document.createElement("h1");
    title.id = "search-results";
    title.className = "list-title";

    if (results.length == 0)
      title.textContent = `No results found for â€œ${term}â€`;
    else if (results.length == 1)
      title.textContent = `Found one result for â€œ${term}â€`;
    else
      title.textContent = `Found ${results.length} results for â€œ${term}â€`;
    target.appendChild(title);
    document.title = title.textContent;

    var template = document.getElementById("search-result");
    for (var result of results)
    {
      var doc = lookup[result.ref];

      // Fill out search result template, adjust as needed.
      var element = template.content.cloneNode(true);
      element.querySelector(".summary-title-link").href = element.querySelector(".read-more-link").href = doc.url;
      element.querySelector(".result-search-title").textContent = doc.title;
      element.querySelector(".summary").textContent = truncate(doc.content, 30);
      element.querySelector(".summary-cover").src = doc.cover
      element.querySelector(".summary-cover").setAttribute("data-large", doc.cover);
      target.appendChild(element);
    }
    title.scrollIntoView(true);

    searchDone();
  }

  // This matches Hugo's own summary logic:
  // https://github.com/gohugoio/hugo/blob/b5f39d23b8/helpers/content.go#L543
  function truncate(text, minWords)
  {
    var match;
    var result = "";
    var wordCount = 0;
    var regexp = /(\S+)(\s*)/g;
    while (match = regexp.exec(text))
    {
      wordCount++;
      if (wordCount <= minWords)
        result += match[0];
      else
      {
        var char1 = match[1][match[1].length - 1];
        var char2 = match[2][0];
        if (/[.?!"]/.test(char1) || char2 == "\n")
        {
          result += match[1];
          break;
        }
        else
          result += match[0];
      }
    }
    return result;
  }
}, false);

blurryImageLoad.load();
