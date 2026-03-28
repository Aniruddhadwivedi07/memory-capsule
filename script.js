let originalData = [];

async function fetchData() {
    try {
        const container = document.getElementById("results");
        container.innerHTML = "<p>Loading...</p>";

        const response = await fetch("https://history.muffinlabs.com/date/3/21");

        const data = await response.json();

        originalData = data.data.Events;

        renderData(originalData);

    } catch (error) {
        console.error("Error fetching data:", error);
        const container = document.getElementById("results");
        container.innerHTML = "<p>Something went wrong. Please try again.</p>";
    }
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
    const query = searchInput.value.toLowerCase();

    if (query === "") {
        renderData(originalData);
        return;
    }

    const filteredData = originalData.filter(item => {
        return item.text.toLowerCase().includes(query);
    });

    renderData(filteredData);
});