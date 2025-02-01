let lastRequestTime = 0; // Track the last API request time
const voteBufferTime = 10000; // 10 seconds in milliseconds
let currentPage = 1; // Track the current page of cards
const maxPages = 10; // Maximum number of pages to load

// reCAPTCHA callback function
function onCaptchaSuccess(token) {
  console.log("reCAPTCHA token received:", token);
  // Proceed with the vote submission
  submitVote(token);
}

async function submitVote(token) {
  const cardName = window.currentCardName; // Store card name globally
  const powerLevel = window.currentPowerLevel; // Store power level globally

  try {
    // Send vote to Google Apps Script with CAPTCHA token
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQa6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardName, powerLevel, token }),
        mode: 'no-cors',
      }
    );

    // Show confirmation message
    const cardElement = document.querySelector(`.card-details:has(button[onclick*="${cardName}"])`);
    const confirmation = document.createElement("p");
    confirmation.textContent = `Voted: Power Level ${powerLevel}`;
    confirmation.style.color = "green";
    cardElement.appendChild(confirmation);
  } catch (error) {
    console.error("Error saving vote:", error);

    // Show error message
    const cardElement = document.querySelector(`.card-details:has(button[onclick*="${cardName}"])`);
    const errorMessage = document.createElement("p");
    errorMessage.textContent = `Failed to save vote: ${error.message}`;
    errorMessage.style.color = "red";
    cardElement.appendChild(errorMessage);
  }
}

async function vote(cardName, powerLevel, event) {
  const cardElement = event.target.closest(".card-details");
  const buttons = cardElement.querySelectorAll(".vote-buttons button");

  // Disable buttons and show loading state
  buttons.forEach((button) => {
    button.disabled = true;
    button.style.backgroundColor = "#cccccc";
  });

  // Store card name and power level globally for use in CAPTCHA callback
  window.currentCardName = cardName;
  window.currentPowerLevel = powerLevel;

  // Execute reCAPTCHA
  grecaptcha.execute();
}

// Load the first set of cards when the page loads
window.onload = loadCards;
