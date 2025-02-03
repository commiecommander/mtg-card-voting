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
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycby9GxLAK01t0eMQa6MdCXRKmtFf2zX5gn-Ayx3mvavNft5C_5VzQfar4kT1eW58TOo/exec",
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
  } catch (error) {
    console.error("Error saving vote:", error);

    // Show error message
    const errorMessage = document.createElement("p");
    errorMessage.textContent = `Failed to save vote: ${error.message}`;
    errorMessage.style.color = "red";
    cardElement.appendChild(errorMessage);
  }
}
