let lastRequestTime = 0; // Track the last API request time
const voteBufferTime = 10000; // 10 seconds in milliseconds

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
