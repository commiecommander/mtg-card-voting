let lastRequestTime = 0; // Track the last API request time
const voteBufferTime = 10000; // 10 seconds in milliseconds
let currentPage = 1; // Track the current page of cards
const maxPages = 10; // Maximum number of pages to load

// Initialize FingerprintJS
FingerprintJS.load()
  .then((fp) => fp.get())
  .then((result) => {
    const fingerprint = result.visitorId; // Unique fingerprint
    localStorage.setItem('fingerprint', fingerprint); // Store fingerprint in localStorage
  })
  .catch((error) => {
    console.error("Error generating fingerprint:", error);
  });

// Fetch the list of cards the user has already voted on
function fetchVotedCards(fingerprint) {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonpCallback_${Date.now()}`;
    const script = document.createElement("script");

    window[callbackName] = (data) => {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(data.votedCards || []);
    };

    script.src = `https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQaA6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec?action=getVotedCards&fingerprint=${fingerprint}&callback=${callbackName}`;
    document.body.appendChild(script);

    script.onerror = () => {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error("Failed to fetch voted cards."));
    };
  });
}

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

    // Fetch commanders sorted by EDHREC rank in ascending order (limited to 4 cards per page)
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=%28game%3Apaper%29+legal%3Acommander&order=edhrec&direction=asc&unique=cards&page=${currentPage}&page_size=4`
    );

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    console.log("API Response:", data);

    // Retrieve the fingerprint from localStorage
    const fingerprint = localStorage.getItem('fingerprint');
    console.log("User fingerprint:", fingerprint);

    // Fetch the list of cards the user has already voted on
    const votedCards = await fetchVotedCards(fingerprint);
    console.log("Cards to hide:", votedCards);

    // Display the cards
    const cardContainer = document.getElementById("cardContainer");
    cardContainer.innerHTML = ""; // Clear previous cards

    data.data.forEach((cardData) => {
      const imageUrl = cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal || '';

      // Check if the user has already voted on this card
      if (votedCards.includes(cardData.name)) {
        console.log("Hiding card:", cardData.name);
        return; // Skip this card
      }

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
            <button onclick="vote('${cardData.name}', 1, event)">Power Level 1 (Exhibition)</button>
            <button onclick="vote('${cardData.name}', 2, event)">Power Level 2 (Core)</button>
            <button onclick="vote('${cardData.name}', 3, event)">Power Level 3 (Upgraded)</button>
            <button onclick="vote('${cardData.name}', 4, event)">Power Level 4 (Optimized)</button>
            <button onclick="vote('${cardData.name}', 5, event)">Power Level 5 (cEDH)</button>
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

  // Retrieve the fingerprint from localStorage
  const fingerprint = localStorage.getItem('fingerprint');
  if (!fingerprint) {
    alert("Unable to verify your browser. Please refresh the page and try again.");
    return;
  }

  // Disable buttons and show loading state
  buttons.forEach((button) => {
    button.disabled = true;
    button.style.backgroundColor = "#cccccc";
  });

  try {
    // Send vote to backend with fingerprint
    await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQaA6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardName, powerLevel, fingerprint }),
        mode: 'no-cors',
      }
    );

    // Show confirmation message
    const confirmation = document.createElement("p");
    confirmation.textContent = `Voted: Power Level ${powerLevel}`;
    confirmation.style.color = "green";
    cardElement.appendChild(confirmation);

    // Hide the card after voting
    cardElement.style.display = "none";
  } catch (error) {
    console.error("Error saving vote:", error);

    // Show error message
    const errorMessage = document.createElement("p");
    errorMessage.textContent = `Failed to save vote: ${error.message}`;
    errorMessage.style.color = "red";
    cardElement.appendChild(errorMessage);
  }
}

// Load the first set of cards when the page loads
window.onload = loadCards;
