// Function to fetch a single card from Scryfall API, ordered by EDHREC rank
async function fetchCardByEDHRECRank() {
  try {
    // Scryfall API endpoint to fetch a single card, ordered by EDHREC rank
    const response = await fetch(
      "https://api.scryfall.com/cards/search?q=game:paper legal:commander&order=edhrec&dir=asc&unique=cards&as=grid"
    );
    const data = await response.json();
    // Return the first card from the results
    return data.data[0];
  } catch (error) {
    console.error("Error fetching card data:", error);
  }
}

// Function to display the card on the page
async function displayCard() {
  const cardContainer = document.getElementById("cardContainer");

  // Fetch the card data
  const cardData = await fetchCardByEDHRECRank();

  if (cardData) {
    // Create the card element
    const cardElement = document.createElement("div");
    cardElement.classList.add("card-details");

    // Populate the card element with data
    cardElement.innerHTML = `
      <img src="${cardData.image_uris?.normal || cardData.card_faces[0].image_uris.normal}" alt="${cardData.name}" />
      <p><strong>Card Name:</strong> ${cardData.name}</p>
      <p><strong>Mana Cost:</strong> ${cardData.mana_cost}</p>
      <p><strong>Card Type:</strong> ${cardData.type_line}</p>
      <p><strong>Text:</strong> ${cardData.oracle_text}</p>
      <p><strong>Power/Toughness:</strong> ${cardData.power}/${cardData.toughness}</p>
      <p><strong>EDHREC Rank:</strong> ${cardData.edhrec_rank || "N/A"}</p>
      <div class="vote-buttons">
        <button onclick="vote('${cardData.name}', 1, event)">Power Level 1</button>
        <button onclick="vote('${cardData.name}', 2, event)">Power Level 2</button>
        <button onclick="vote('${cardData.name}', 3, event)">Power Level 3</button>
        <button onclick="vote('${cardData.name}', 4, event)">Power Level 4</button>
        <button onclick="vote('${cardData.name}', 0, event)">Not Ready to Vote</button>
      </div>
    `;

    // Append the card to the container
    cardContainer.appendChild(cardElement);
  } else {
    // Handle the case where no card data is returned
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Failed to load card data.";
    errorMessage.style.color = "red";
    cardContainer.appendChild(errorMessage);
  }
}

// Call the function to display the card when the page loads
displayCard();

// Voting function (same as before)
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
        mode: "no-cors",
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
