let lastVoteTime = 0; // Track the time of the last vote
const voteCooldown = 3000; // 3 seconds cooldown between votes

async function vote(cardName, powerLevel, event) {
  const now = Date.now();
  if (now - lastVoteTime < voteCooldown) {
    alert("Please wait a few seconds before voting again.");
    return;
  }
  lastVoteTime = now;

  const cardElement = event.target.closest(".card-details");
  const buttons = cardElement.querySelectorAll(".vote-buttons button");

  // Check if the user has already voted on this card
  const votedCards = JSON.parse(localStorage.getItem("votedCards") || "[]");
  if (votedCards.includes(cardName)) {
    alert("You have already voted on this card.");
    return;
  }

  // Get the reCAPTCHA response
  const recaptchaResponse = grecaptcha.getResponse();
  if (!recaptchaResponse) {
    alert("Please complete the reCAPTCHA.");
    return;
  }

  try {
    // Disable buttons and show loading state
    buttons.forEach((button) => {
      button.disabled = true;
      button.style.backgroundColor = "#cccccc";
    });

    // Send vote and reCAPTCHA response to Google Apps Script
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQaA6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardName, powerLevel, recaptchaResponse }),
        mode: "no-cors",
      }
    );

    // Add the card to the list of voted cards
    votedCards.push(cardName);
    localStorage.setItem("votedCards", JSON.stringify(votedCards));

    // Show confirmation message
    const confirmation = document.createElement("p");
    confirmation.textContent = `Voted: Power Level ${powerLevel}`;
    confirmation.style.color = "green";
    cardElement.appendChild(confirmation);

    // Reset reCAPTCHA
    grecaptcha.reset();
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
