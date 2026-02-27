// Tab switching
document.querySelectorAll('.tab').forEach(function (tab) {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });

    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');

    // Start loading cats when the cats tab is first opened
    if (tab.dataset.tab === 'cats' && !catsInitialized) {
      catsInitialized = true;
      loadCats();
      setupInfiniteScroll();
    }
  });
});

// Infinite cat scrolling
var catsInitialized = false;
var isLoading = false;
var CATS_PER_BATCH = 20;
var catBatchNumber = 0;

function createCatCard(src) {
  var card = document.createElement('div');
  card.className = 'cat-card';

  var img = document.createElement('img');
  img.src = src;
  img.alt = 'A cute cat';
  img.loading = 'lazy';

  // If this image fails, replace it with a fallback
  img.onerror = function () {
    this.onerror = null;
    this.src = 'https://placekitten.com/' + (280 + Math.floor(Math.random() * 40)) + '/' + (280 + Math.floor(Math.random() * 40));
  };

  card.appendChild(img);
  return card;
}

function showLoading() {
  document.getElementById('loading').classList.add('visible');
}

function hideLoading() {
  document.getElementById('loading').classList.remove('visible');
}

function isSentinelInView() {
  var sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel) return false;
  var rect = sentinel.getBoundingClientRect();
  // Check if sentinel is within the viewport + 600px buffer
  return rect.top < window.innerHeight + 600;
}

function loadCats() {
  if (isLoading) return;
  isLoading = true;
  showLoading();

  catBatchNumber++;
  var currentBatch = catBatchNumber;
  var grid = document.getElementById('cats-grid');

  // Fetch random cat images from The Cat API
  fetch('https://api.thecatapi.com/v1/images/search?limit=' + CATS_PER_BATCH + '&_t=' + Date.now())
    .then(function (res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
    .then(function (cats) {
      var fragment = document.createDocumentFragment();
      cats.forEach(function (cat) {
        fragment.appendChild(createCatCard(cat.url));
      });
      grid.appendChild(fragment);
      isLoading = false;
      hideLoading();
      // After adding images, check if we need to load more to fill the viewport
      scheduleFillCheck();
    })
    .catch(function () {
      // Fallback: generate cats from cataas.com with unique URLs
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < CATS_PER_BATCH; i++) {
        var src = 'https://cataas.com/cat?v=' + currentBatch + '-' + i + '-' + Date.now();
        fragment.appendChild(createCatCard(src));
      }
      grid.appendChild(fragment);
      isLoading = false;
      hideLoading();
      // After adding images, check if we need to load more to fill the viewport
      scheduleFillCheck();
    });
}

function scheduleFillCheck() {
  // Wait a short moment for the DOM to update, then check if the sentinel
  // is still in view. If it is, the page isn't tall enough yet, so load more.
  setTimeout(function () {
    if (!isLoading && isSentinelInView()) {
      loadCats();
    }
  }, 200);
}

function setupInfiniteScroll() {
  var sentinel = document.getElementById('scroll-sentinel');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !isLoading) {
          loadCats();
        }
      });
    }, {
      rootMargin: '0px 0px 600px 0px'
    });

    observer.observe(sentinel);
  }

  // Always also use scroll event as a backup — this catches cases
  // where IntersectionObserver doesn't re-fire
  window.addEventListener('scroll', function () {
    var catsSection = document.getElementById('cats');
    if (!catsSection.classList.contains('active')) return;
    if (isLoading) return;
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
      loadCats();
    }
  });
}
