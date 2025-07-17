(function () {
  "use strict";

  const form = document.querySelector("#authenticationForm");
  const errBox = document.querySelector("#errorBox");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errBox.textContent = "";

    const formData = new FormData(form);
    const username = formData.get("username");
    const password = formData.get("password");

    const clickedButton = document.activeElement.id;
    const signIn = clickedButton === "signin";
    const authFunction = signIn ? apiService.signIn : apiService.signUp;

    authFunction(username, password)
      .then((res) => {
        if (res && res.error) {
          errBox.textContent = res.error;
          return;
        } else if (res) {
          if (!signIn) {
            // Auto sign-in
            return apiService.signIn(username, password);
          }
          return res;
        }
      })
      .then((res) => {
        if (res && res.error) {
          errBox.textContent = res.error;
        } else if (res) {
          location.replace("/index.html");
        }
      })
      .catch((err) => {
        errBox.textContent =
          err.message || "An error occurred during authentication.";
      });
  });
})();
