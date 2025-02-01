let lastRequestTime = 0; // Track the last API request time
const voteBufferTime = 10000; // 10 seconds in milliseconds
let currentPage = 1; // Track the current page of cards
const maxPages = 10; // Maximum number of pages to load

async function loadCards() {
  const now = Date.now();
  if (now - lastRequestTime < voteBufferTime) {
    alert("Please wait 10 seconds before loading more cards.");
    return;
  }
  lastRequestTime = now;

  if (currentPage > maxPages) {
    alert("No more cards to load.");
    return;
  }

  try {
    // Hide the "Next 10 Cards" button while loading
    document.getElementById("nextCardButton").style.display = "none";

    // Fetch top 10 commanders sorted by EDHREC rank
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=is%3Acommander+game%3Apaper&order=edhrec&unique=cards&page=${currentPage}`
    );

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    if (!data.data || data.data.length === 0) throw new Error("No cards found.");

    const cards = data.data;

    // Display the cards
    const cardContainer = document.getElementById("cardContainer");
    cardContainer.innerHTML = ""; // Clear previous cards

    cards.forEach((cardData) => {
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

    // Show the "Next 10 Cards" button
    document.getElementById("nextCardButton").style.display = "block";
    currentPage++; // Move to next page for future calls
  } catch (error) {
    document.getElementById("cardContainer").innerHTML = `<p>Failed to load cards. Please try again.</p>`;
    console.error("Error loading cards:", error);
  }
}

async function vote(cardName, powerLevel, event) {
  const cardElement = event.target.closest(".card-details");
  const buttons = cardElement.querySelectorAll(".vote-buttons button");

  try {
    // Disable buttons and show loading state
    buttons.forEach((button) => {
      button.disabled = true;
      button.style.backgroundColor = "#cccccc";
    });

    // Send vote to Google Apps Script
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQaA6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardName, powerLevel }),
        mode: 'no-cors',
      }
    );

    // Show confirmation message
    const confirmation = document.createElement("p");
    confirmation.textContent = `Voted: Power Level ${powerLevel}`;
    confirmation.style.color = "green";
    cardElement.appendChild(confirmation);
  } catch (error) {
    console.error("Error saving vote:", error);

    // Re-enable buttons and show error message
    buttons.forEach((button) => {
      button.disabled = false;
      button.style.backgroundColor = "";
    });

    const errorMessage = document.createElement("p");
    errorMessage.textContent = `Failed to save vote: ${error.message}`;
    errorMessage.style.color = "red";
    cardElement.appendChild(errorMessage);
  }
}

// Load the first set of cards when the page loads
window.onload = loadCards;
