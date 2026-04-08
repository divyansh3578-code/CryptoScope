const form = document.getElementById("signupForm");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (password.value !== confirmPassword.value) {
    errorMsg.textContent = "Passwords are not same";
    return;
  }

 // errorMsg.textContent = "";

  alert("Account created ");

  // Later: send data to backend
});
