// using fetch, async/await, localStorage and OpenWeatherMap.
// Replace this text with your own OpenWeatherMap API key.
const API_KEY = "717e9d114fc2da1a8ab7bcbeb8a202f3";

// Get the HTML elements we need to update.
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const unitButton = document.getElementById("unitButton");
const message = document.getElementById("message");
const weatherCard = document.getElementById("weatherCard");
const forecast = document.getElementById("forecast");
const historyContainer = document.getElementById("history");
const clearHistoryButton = document.getElementById("clearHistory");

// Store the user's preferred temperature unit.
let unit = localStorage.getItem("weatherUnit") || "C";

// This lets us switch units without fetching again.
let currentData = null;
let forecastData = null;
let currentCity = "";

// Read saved search history from localStorage.
let searchHistory = JSON.parse(
    localStorage.getItem("weatherHistory") || "[]"
);

// Show the temperature unit on the button.
function updateUnitButton() {
    unitButton.textContent =
        unit === "C" ? "Switch to °F" : "Switch to °C";
}

// Convert Celsius to Fahrenheit when needed.
function convertTemperature(celsius) {
    if (unit === "F") {
        return Math.round((celsius * 9) / 5 + 32);
    }

    return Math.round(celsius);
}

// Add the correct temperature symbol.
function showTemperature(celsius) {
    return `${convertTemperature(celsius)}°${unit}`;
}

// Display a message to the user.
function showMessage(text) {
    message.textContent = text;
}


// Show the user's previous searches as clickable buttons.
function displayHistory() {
    historyContainer.innerHTML = "";

    // Update the input's autocomplete suggestions.
    let suggestions = document.getElementById("citySuggestions");

    if (!suggestions) {
        suggestions = document.createElement("datalist");
        suggestions.id = "citySuggestions";
        cityInput.setAttribute("list", "citySuggestions");
        cityInput.insertAdjacentElement("afterend", suggestions);
    }

    suggestions.innerHTML = "";

    searchHistory.forEach(function (city) {
        // Add a city to the input's autocomplete list.
        const option = document.createElement("option");
        option.value = city;
        suggestions.appendChild(option);

        // Make a clickable history button.
        const button = document.createElement("button");
        button.textContent = city;
        button.type = "button";

        button.addEventListener("click", function () {
            cityInput.value = city;
            getWeather(city);
        });

        historyContainer.appendChild(button);
    });
}

// Save a city and keep only the latest 10 searches.
function saveHistory(city) {
    searchHistory = [
        city,
        ...searchHistory.filter(function (oldCity) {
            return oldCity.toLowerCase() !== city.toLowerCase();
        })
    ].slice(0, 10);

    localStorage.setItem(
        "weatherHistory",
        JSON.stringify(searchHistory)
    );

    displayHistory();
}
