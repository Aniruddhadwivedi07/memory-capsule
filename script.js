
let originalData = [];

async function fetchData() {
    try {
        const response = await fetch("https://history.muffinlabs.com/date/3/21");

        const data = await response.json();

        originalData = data.data.Events;

        renderData(originalData);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function renderData(data) {
    const container = document.getElementById("results");

    container.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");

        card.innerHTML = `
            <h3>${item.year}</h3>
            <p>${item.text}</p>
        `;

        container.appendChild(card);
    });
}

fetchData();