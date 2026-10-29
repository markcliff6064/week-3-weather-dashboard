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
