let originalData = [];
let currentType = "Events";
let fullData = {};

let currentMonth = 4;
let currentDay = 8;
let targetYear = null;

let currentSort = "asc";
let loadingStartTime = 0;
const MIN_LOADING_TIME = 800;
const imageCache = {};

function showLoadingSkeleton() {
    const container = document.getElementById("results");
    container.innerHTML = "";
    for (let i = 0; i < 6; i++) {
        const wrapper = document.createElement("div");
        wrapper.className = "card-wrapper";
        const skeleton = document.createElement("div");
        skeleton.classList.add("card", "skeleton-card");
        wrapper.appendChild(skeleton);
        container.appendChild(wrapper);
    }
}

async function fetchData(month, day) {
    try {
        const container = document.getElementById("results");
        loadingStartTime = Date.now();
        showLoadingSkeleton();

        const response = await fetch(`https://history.muffinlabs.com/date/${month}/${day}`);
        const data = await response.json();

        fullData = data.data;
        originalData = fullData[currentType] || [];
        applyAllFilters();
    } catch (error) {
        console.error("Error fetching data:", error);
        const container = document.getElementById("results");
        container.innerHTML = "<div class='empty-state'>Something went wrong unraveling history. Please try again.</div>";
    }
}

function applyAllFilters() {
    let data = [...originalData];

    if (targetYear) {
        data = data.filter(item => parseInt(item.year, 10) === targetYear);
    }

    if (currentSort === "asc") {
        data.sort((a, b) => {
            let ya = parseYear(a.year);
            let yb = parseYear(b.year);
            return ya - yb;
        });
    } else {
        data.sort((a, b) => {
            let ya = parseYear(a.year);
            let yb = parseYear(b.year);
            return yb - ya;
        });
    }

    renderData(data);
}

function parseYear(yStr) {
    let isBC = yStr.includes("BC");
    let match = yStr.match(/\d+/);
    if (!match) return 0;
    let num = parseInt(match[0], 10);
    return isBC ? -num : num;
}

async function renderData(data) {
    const container = document.getElementById("results");
    const countDiv = document.getElementById("resultsCount");
    
    const elapsed = Date.now() - loadingStartTime;
    const delay = Math.max(0, MIN_LOADING_TIME - elapsed);
    await new Promise(res => setTimeout(res, delay));

    container.innerHTML = "";
    countDiv.textContent = `Showing ${data.length} result${data.length !== 1 ? 's' : ''}`;

    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                No historical records found for this precise moment. 🕰️<br>
                Try adjusting the date filters.
            </div>
        `;
        return;
    }

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    data.forEach(item => {
        const wrapper = document.createElement("div");
        wrapper.className = "card-wrapper";
        const card = document.createElement("div");
        card.classList.add("card");

        const img = document.createElement("img");
        img.loading = "lazy";

        const headerDiv = document.createElement("div");
        headerDiv.className = "card-header";

        const titleEl = document.createElement("h3");
        titleEl.textContent = item.year;

        const favBtn = document.createElement("button");
        favBtn.classList.add("fav-btn");
        const isFav = favorites.find(f => f.text === item.text);
        favBtn.textContent = isFav ? "♥" : "♡";

        headerDiv.appendChild(titleEl);
        headerDiv.appendChild(favBtn);

        const textEl = document.createElement("p");
        textEl.textContent = item.text;

        card.appendChild(img);
        card.appendChild(headerDiv);
        card.appendChild(textEl);
        wrapper.appendChild(card);

        if (item.links && item.links.length > 0) {
            const title = item.links[0].title;
            if (imageCache[title]) {
                img.src = imageCache[title];
            } else {
                img.style.display = 'none'; 
                fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
                    .then(res => res.json())
                    .then(wikiData => {
                        const url = wikiData.thumbnail?.source || "";
                        if (url) {
                            imageCache[title] = url;
                            img.src = url;
                            img.style.display = 'block';
                        }
                    })
                    .catch(() => {});
            }
        } else {
            img.style.display = 'none';
        }

        favBtn.addEventListener("click", () => {
            let favs = JSON.parse(localStorage.getItem("favorites")) || [];
            const exists = favs.find(f => f.text === item.text);

            if (exists) {
                favs = favs.filter(f => f.text !== item.text);
                favBtn.textContent = "♡";
            } else {
                favs.push(item);
                favBtn.textContent = "♥";
            }
            localStorage.setItem("favorites", JSON.stringify(favs));
        });

        container.appendChild(wrapper);
    });
}

const searchBtn = document.getElementById("searchBtn");
const dayInput = document.getElementById("dayInput");
const monthInput = document.getElementById("monthInput");
const yearInput = document.getElementById("yearInput");

searchBtn.addEventListener("click", () => {
    let m = parseInt(monthInput.value, 10);
    let d = parseInt(dayInput.value, 10);
    let y = parseInt(yearInput.value, 10);


    if (isNaN(m) || m < 1 || m > 12) m = currentMonth;
    if (isNaN(d) || d < 1 || d > 31) d = currentDay;
    
    targetYear = isNaN(y) ? null : y;
    

    monthInput.value = m.toString().padStart(2, '0');
    dayInput.value = d.toString().padStart(2, '0');
    if (targetYear !== null) yearInput.value = y.toString();
    else yearInput.value = "";

    if (currentMonth !== m || currentDay !== d) {
        currentMonth = m;
        currentDay = d;
        fetchData(currentMonth, currentDay);
    } else {
        applyAllFilters();
    }
});

const tabBtns = document.querySelectorAll(".tab-btn");
tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        tabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentType = btn.getAttribute("data-type");
        originalData = fullData[currentType] || [];
        applyAllFilters();
    });
});

const sortSelect = document.getElementById("sortSelect");
sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value;
    applyAllFilters();
});

const today = new Date();
currentMonth = today.getMonth() + 1;
currentDay = today.getDate();
monthInput.value = currentMonth.toString().padStart(2, '0');
dayInput.value = currentDay.toString().padStart(2, '0');

fetchData(currentMonth, currentDay);