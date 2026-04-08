let originalData = [];
let currentType = "Events";
let fullData = {};

let currentMonth = 3;
let currentDay = 21;

let currentQuery = "";
let currentSort = "asc";

let loadingStartTime = 0;
const MIN_LOADING_TIME = 800; 

const imageCache = {};

function showLoadingSkeleton() {
    const container = document.getElementById("results");
    container.innerHTML = "";

    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement("div");
        skeleton.classList.add("card");
        skeleton.innerHTML = `
            <div style="height:150px; background:#ddd; border-radius:10px; margin-bottom:10px;"></div>
            <div style="height:20px; width:40%; background:#ddd; margin-bottom:8px;"></div>
            <div style="height:14px; width:80%; background:#eee;"></div>
        `;
        container.appendChild(skeleton);
    }
}

async function fetchData(month = currentMonth, day = currentDay) {
    try {
        const container = document.getElementById("results");
        loadingStartTime = Date.now();
        showLoadingSkeleton();

        const response = await fetch(`https://history.muffinlabs.com/date/${month}/${day}`);

        const data = await response.json();

        fullData = data.data;
        originalData = fullData[currentType];

        renderData(originalData);

    } catch (error) {
        console.error("Error fetching data:", error);
        const container = document.getElementById("results");
        container.innerHTML = "<p>Something went wrong. Please try again.</p>";
    }
}

function applyAllFilters() {
    let data = [...originalData];

    // Search
    if (currentQuery !== "") {
        data = data.filter(item => item.text.toLowerCase().includes(currentQuery));
    }

    // Sort
    if (currentSort === "asc") {
        data.sort((a, b) => a.year - b.year);
    } else {
        data.sort((a, b) => b.year - a.year);
    }

    renderData(data);
}

async function renderData(data) {
    const container = document.getElementById("results");

    const elapsed = Date.now() - loadingStartTime;
    const delay = Math.max(0, MIN_LOADING_TIME - elapsed);

    await new Promise(res => setTimeout(res, delay));

    container.innerHTML = "";

    const countDiv = document.createElement("div");
    countDiv.style.marginBottom = "15px";
    countDiv.style.fontWeight = "bold";
    countDiv.textContent = `Showing ${data.length} result${data.length !== 1 ? 's' : ''}`;
    container.appendChild(countDiv);

    if (data.length === 0) {
        const empty = document.createElement("div");
        empty.style.textAlign = "center";
        empty.style.padding = "40px";
        empty.innerHTML = `
            <p style="font-size:18px; margin-bottom:10px;">No results found 😢</p>
            <p style="color:#777;">Try a different search or filter</p>
        `;
        container.appendChild(empty);
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        const img = document.createElement("img");
        img.style.width = "100%";
        img.style.borderRadius = "10px";
        img.style.marginBottom = "10px";
        img.loading = "lazy";

        card.appendChild(img);

        const titleEl = document.createElement("h3");
        titleEl.textContent = item.year;

        const textEl = document.createElement("p");
        textEl.textContent = item.text;

        const favBtn = document.createElement("button");
        favBtn.classList.add("fav-btn");
        favBtn.textContent = "♡";

        card.appendChild(titleEl);
        card.appendChild(textEl);
        card.appendChild(favBtn);


        if (item.links && item.links.length > 0) {
            const title = item.links[0].title;

            if (imageCache[title]) {
                img.src = imageCache[title];
            } else {
                fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
                    .then(res => res.json())
                    .then(wikiData => {
                        const url = wikiData.thumbnail?.source || "";
                        if (url) {
                            imageCache[title] = url;
                            img.src = url;
                        }
                    })
                    .catch(() => {});
            }
        }


        favBtn.addEventListener("click", () => {
            let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

            const exists = favorites.find(f => f.text === item.text);

            if (exists) {
                favorites = favorites.filter(f => f.text !== item.text);
                favBtn.textContent = "♡";
            } else {
                favorites.push(item);
                favBtn.textContent = "❤️";
            }

            localStorage.setItem("favorites", JSON.stringify(favorites));
        });

        container.appendChild(card);
    });
}

fetchData();

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    currentQuery = searchInput.value.toLowerCase();
    applyAllFilters();
});
const filterButtons = document.querySelectorAll("#filter-container button");

filterButtons.forEach(button => {
    button.addEventListener("click", function () {
        filterButtons.forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        currentType = button.textContent;
        
        originalData = fullData[currentType];
        applyAllFilters();
    });
});

const sortSelect = document.getElementById("sortSelect");

sortSelect.addEventListener("change", function () {
    currentSort = sortSelect.value;
    applyAllFilters();
});


const dateInput = document.getElementById("dateInput");

if (dateInput) {
    dateInput.addEventListener("change", () => {
        const value = dateInput.value; 

        if (!value) return;

        const parts = value.split("-");
        currentMonth = parseInt(parts[1]);
        currentDay = parseInt(parts[2]);

        fetchData(currentMonth, currentDay);
    });
}
const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "🌙";
    }
});