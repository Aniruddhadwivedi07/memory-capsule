let originalData = [];
let currentType = "Events";
let fullData = {};

let currentMonth = 3;
let currentDay = 21;

let currentQuery = "";
let currentSort = "asc";

let loadingStartTime = 0;
const MIN_LOADING_TIME = 800; // ms

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

    const cards = await Promise.all(data.map(async (item) => {
        let imageUrl = "";

        try {
            if (item.links && item.links.length > 0) {
                const title = item.links[0].title;

                const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
                const wikiData = await res.json();

                imageUrl = wikiData.thumbnail?.source || "";
            }
        } catch (e) {
            console.error("Image fetch failed", e);
        }

        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            ${imageUrl ? `<img src="${imageUrl}" alt="image" style="width:100%; border-radius:10px; margin-bottom:10px;"/>` : ""}
            <h3>${item.year}</h3>
            <p>${item.text}</p>
            <button class="fav-btn">♡</button>
        `;

        const favBtn = card.querySelector(".fav-btn");

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

        return card;
    }));
    cards.forEach(card => container.appendChild(card));
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
        const value = dateInput.value; // format: YYYY-MM-DD

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