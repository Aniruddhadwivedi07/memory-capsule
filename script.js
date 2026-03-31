let originalData = [];
let currentType = "Events";
let fullData = {};

let currentQuery = "";
let currentSort = "asc";

async function fetchData() {
    try {
        const container = document.getElementById("results");
        container.innerHTML = "<p>Loading...</p>";

        const response = await fetch("https://history.muffinlabs.com/date/3/21");

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

function renderData(data) {
    const container = document.getElementById("results");

    container.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <h3>${item.year}</h3>
            <p>${item.text}</p>
        `;

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