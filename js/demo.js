// --- Interactive Demo Logic ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Define the original, valid proof data and cryptographic keys
  const publicKeyHex =
    "5e07cbe0cd913e484aae0dd71e9f91753722382c80ae189eae94e2c7c6cec3b9";
  const signatureHex =
    "840978c9af0f643ecf83e3127db7cbeba613c1ad5314d7febec9742850ada2760a14882eb86351c34a1f80fbf2a6ad8278be07c59ef00207610539e0f2940301";

  // Store original proof values
  const ORIGINAL_VALUES = {
    url: "https://api.stripe.com/webhook",
    timestamp: "2024-01-15T10:30:45Z",
    status: "200",
    hash: "3b7e72d4a8f9e1c2...",
  };

  // Utility to convert hex strings to Uint8Array byte arrays
  const fromHex = (hexString) =>
    new Uint8Array(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
    );
  const publicKey = fromHex(publicKeyHex);
  const signature = fromHex(signatureHex);

  // 2. Create the message bytes to verify
  function createMessage(data) {
    const encoder = new TextEncoder();
    const dataString = `${data.url}|${data.timestamp}|${data.status}|${data.hash}`;
    return encoder.encode(dataString);
  }

  // 3. The main verification function
  function verifyProof(currentData) {
    const message = createMessage(currentData);
    return nacl.sign.detached.verify(message, signature, publicKey);
  }

  // 4. Get DOM elements
  const signatureStatusEl = document.getElementById("signature-status");
  const verificationStatusEl = document.getElementById("verification-status");
  const resetButton = document.getElementById("reset-button");

  // 5. Update verification status in real-time
  async function updateVerificationStatus() {
    const currentData = {
      url: document.getElementById("demo-url").value,
      timestamp: document.getElementById("demo-timestamp").value,
      status: document.getElementById("demo-status").value,
      hash: document.getElementById("demo-hash").value,
    };

    // Compute the hash of current data
    const message = createMessage(currentData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', message);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashDisplay = hashHex.substring(0, 8) + '...' + hashHex.substring(hashHex.length - 8);

    // Update signature display with current hash
    signatureStatusEl.textContent = hashDisplay;

    // Verify against the original signature
    const isValid = verifyProof(currentData);

    if (isValid) {
      // Valid proof - show success state
      signatureStatusEl.className = "demo-value signature-hex verified";
      verificationStatusEl.innerHTML = '<span class="verified">✓ Verified</span>';
      resetButton.classList.add("hidden");
    } else {
      // Invalid proof - show tampered state
      signatureStatusEl.className = "demo-value signature-hex failed";
      verificationStatusEl.innerHTML = '<span class="failed">✗ TAMPERED!</span>';
      resetButton.classList.remove("hidden");
    }
  }

  // 6. Reset function to restore original values
  function resetToOriginal() {
    document.getElementById("demo-url").value = ORIGINAL_VALUES.url;
    document.getElementById("demo-timestamp").value = ORIGINAL_VALUES.timestamp;
    document.getElementById("demo-status").value = ORIGINAL_VALUES.status;
    document.getElementById("demo-hash").value = ORIGINAL_VALUES.hash;
    updateVerificationStatus();
  }

  // 7. Attach event listeners to all input fields
  const inputs = document.querySelectorAll(".demo-input");
  inputs.forEach((input) => {
    input.addEventListener("input", updateVerificationStatus);
  });

  // 8. Attach event listener to reset button
  resetButton.addEventListener("click", resetToOriginal);

  // 9. Run the verification once on page load to set the initial state
  updateVerificationStatus();
});
