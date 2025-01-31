async function loadCards() {
  const now = Date.now();
  if (now - lastRequestTime < voteBufferTime) {
    alert("Please wait 10 seconds before loading more cards.");
    return;
  }
  lastRequestTime = now;

  try {
    document.getElementById("nextCardButton").style.display = "none"; // Hide button while loading

    // Fetch 10 commander-legal cards sorted by EDHREC rank
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=is%3Acommander+game%3Apaper&order=edhrec&page=${currentPage}`
    );

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error("No cards found.");
    }

    console.log("Fetched Cards:", data.data); // Debug: Log response data

    const cardContainer = document.getElementById("cardContainer");
    cardContainer.innerHTML = ""; // Clear previous cards

    data.data.forEach((cardData) => {
      const imageUrl = cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal || '';
      cardContainer.innerHTML += `
        <div class="card-details">
          <img src="${imageUrl}" alt="Card Image of ${cardData.name}" />
          <p><strong>Card Name:</strong> ${cardData.name}</p>
          <p><strong>Mana Cost:</strong> ${cardData.mana_cost || 'N/A'}</p>
          <p><strong>Card Type:</strong> ${cardData.type_line}</p>
          <p><strong>Text:</strong> ${cardData.oracle_text || 'No text available.'}</p>
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

    document.getElementById("nextCardButton").style.display = "block"; // Show button after loading
  } catch (error) {
    document.getElementById("cardContainer").innerHTML = `<p>Failed to load cards. Please try again.</p>`;
    console.error("Error loading cards:", error);
  }
}
