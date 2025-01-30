let lastRequestTime = 0; // Track the last API request time
const voteBufferTime = 10000; // 10 seconds in milliseconds
const fetchedCards = []; // Cache fetched cards
let currentPage = 1; // Track the current page of cards

// Google Sheets configuration
const sheetId = "1_KmHPHuO8YE8XEu7_XNrKg0vzcaDQnfsz-C0cohZn_M"; // Replace with your Google Sheet ID
const apiKey = "AIzaSyDZxQsHrQsyqD2WrwQZYcvdztlh34K9y5s"; // Replace with your Google Sheets API key
const sheetName = "Power Level Results"; // Replace with your sheet name

async function loadCards() {
  const now = Date.now();
  if (now - lastRequestTime < voteBufferTime) {
    alert("Please wait 10 seconds before loading more cards.");
    return;
  }
  lastRequestTime = now;

  try {
    // Hide the "Next 3 Cards" button while loading
    document.getElementById("nextCardButton").style.display = "none";

    // Fetch 3 cards sorted by EDHREC rank in ascending order
    const response = await fetch(
      `https://api.scryfall.com/cards/search?order=edhrec&q=is%3Acommander&dir=asc&unique=cards&page=${currentPage}&per_page=3`
    );
    const data = await response.json();

    // Check if cards were found
    if (!data.data || data.data.length === 0) {
      throw new Error("No cards found");
    }

    const cards = data.data;

    // Add fetched cards to the cache
    fetchedCards.push(...cards);

    // Display the cards
    const cardContainer = document.getElementById("cardContainer");
    cards.forEach((cardData, index) => {
      const imageUrl = cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal || '';
      cardContainer.innerHTML += `
        <div class="card-details">
          <img src="${imageUrl}" alt="Card Image of ${cardData.name}" />
          <p><strong>Card Name:</strong> ${cardData.name}</p>
          <p><strong>Mana Cost:</strong> ${cardData.mana_cost || 'N/A'}</p>
          <p><strong>Card Type:</strong> ${cardData.type_line}</p>
          <p><strong>Text:</strong> ${cardData.oracle_text || 'No text available.'}</p>
          <p><strong>Power/Toughness:</strong> ${cardData.power ? `${cardData.power}/${cardData.toughness}` : 'N/A'}</p>
          <p><strong>EDHREC Rank:</strong> ${cardData.edhrec_rank || 'N/A'}</p>
          <div class="vote-buttons">
            <button onclick="vote('${cardData.name}', 1, event)">Power Level 1</button>
            <button onclick="vote('${cardData.name}', 2, event)">Power Level 2</button>
            <button onclick="vote('${cardData.name}', 3, event)">Power Level 3</button>
            <button onclick="vote('${cardData.name}', 4, event)">Power Level 4</button>
            <button onclick="vote('${cardData.name}', 0, event)">Not Ready to Vote</button>
          </div>
        </div>
      `;
    });

    // Increment the page for the next request
    currentPage++;

    // Show the "Next 3 Cards" button
    document.getElementById("nextCardButton").style.display = "block";
  } catch (error) {
    document.getElementById("cardContainer").innerHTML = `<p>Failed to load cards. Please try again.</p>`;
    console.error("Error loading cards:", error);
  }
}

async function vote(cardName, powerLevel, event) {
  try {
    // Disable vote buttons for this card only
    const cardElement = event.target.closest(".card-details");
    const buttons = cardElement.querySelectorAll(".vote-buttons button");
    buttons.forEach((button) => {
      button.disabled = true;
    });

    // Show a confirmation message
    const confirmation = document.createElement("p");
    confirmation.textContent = `Voted: Power Level ${powerLevel}`;
    confirmation.style.color = "green";
    cardElement.appendChild(confirmation);

    // Fetch existing votes from Google Sheets
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${apiKey}`
    );
    const data = await response.json();

    console.log("Fetched data from Google Sheets:", data); // Debugging

    // Check if data was found
    if (!data.values || data.values.length === 0) {
      throw new Error("No voting data found");
    }

    // Find the row for the current card
    let cardRow = data.values.find((row) => row[0] === cardName);
    if (!cardRow) {
      // If the card doesn't exist, create a new row
      cardRow = [cardName, 0, 0, 0, 0, 0, 0];
      data.values.push(cardRow);
    }

    // Update the vote count for the selected power level
    if (powerLevel >= 1 && powerLevel <= 4) {
      cardRow[powerLevel] = parseInt(cardRow[powerLevel]) + 1;
    }

    // Calculate majority and average power levels
    const votes = cardRow.slice(1, 5).map(Number);
    const totalVotes = votes.reduce((sum, count) => sum + count, 0);
    const majority = votes.indexOf(Math.max(...votes)) + 1;
    const average = (votes.reduce((sum, count, index) => sum + count * (index + 1), 0) / totalVotes).toFixed(2);

    // Update the majority and average columns
    cardRow[5] = majority;
    cardRow[6] = average;

    // Update the Google Sheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?valueInputOption=USER_ENTERED&key=${apiKey}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: data.values,
        }),
      }
    );

    console.log("Update response:", updateResponse); // Debugging

    if (!updateResponse.ok) {
      throw new Error("Failed to update Google Sheets");
    }

    console.log(`Voted for ${cardName}: Power Level ${powerLevel}`);
  } catch (error) {
    console.error("Error saving vote:", error);
  }
}

// Load the first set of cards when the page loads
window.onload = loadCards;
