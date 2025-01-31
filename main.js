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

    // Send vote to Google Apps Script
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQaA6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardName, powerLevel }),
        mode: 'no-cors', // Add this line to bypass CORS
      }
    );

    // Since 'no-cors' mode doesn't allow reading the response, we assume success
    console.log(`Voted for ${cardName}: Power Level ${powerLevel}`);
  } catch (error) {
    console.error("Error saving vote:", error);
  }
}
