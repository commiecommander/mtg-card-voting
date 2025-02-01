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
    // Hide the "Next 3 Cards" button while loading
    document.getElementById("nextCardButton").style.display = "none";

    // Fetch commanders sorted by EDHREC rank (limited to 3 cards per page)
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=is%3Acommander+game%3Apaper&order=edhrec&unique=cards&page=${currentPage}&page_size=3`
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

    // Show the "Next 3 Cards" button
    document.getElementById("nextCardButton").style.display = "block";
    currentPage++; // Move to next page for future calls
  } catch (error) {
    document.getElementById("cardContainer").innerHTML = `<p>Failed to load cards. Please try again.</p>`;
    console.error("Error loading cards:", error);
  }
}
