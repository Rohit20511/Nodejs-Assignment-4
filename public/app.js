/*
 * Frontend Logic for application
 *
 */

// Container for frontend application
var app = {};

// Config
app.config = {
  sessionToken: false
};

// AJAX Client (for RESTful API)
app.client = {};

// Interface for making API calls
app.client.request = function(
  headers,
  path,
  method,
  queryStringObject,
  payload,
  callback
) {
  // Set defaults
  headers = typeof headers == "object" && headers !== null ? headers : {};
  path = typeof path == "string" ? path : "/";
  method =
    typeof method == "string" &&
    ["POST", "GET", "PUT", "DELETE"].indexOf(method.toUpperCase()) > -1
      ? method.toUpperCase()
      : "GET";
  queryStringObject =
    typeof queryStringObject == "object" && queryStringObject !== null
      ? queryStringObject
      : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
  callback = typeof callback == "function" ? callback : false;

  // For each query string parameter sent, add it to the path
  var requestUrl = path + "?";
  var counter = 0;
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      // If at least one query string parameter has already been added, preprend new ones with an ampersand
      if (counter > 1) {
        requestUrl += "&";
      }
      // Add the key and value
      requestUrl += queryKey + "=" + queryStringObject[queryKey];
    }
  }

  // Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-type", "application/json");

  // For each header sent, add it to the request
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  // If there is a current session token set, add that as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  // When the request comes back, handle the response
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status;
      var responseReturned = xhr.responseText;

      // Callback if requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  };

  // Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};

// Bind the logout button
app.bindLogoutButton = function() {
  if(document.getElementById("logoutButton")){
      document
        .getElementById("logoutButton")
        .addEventListener("click", function(e) {
          // Stop it from redirecting anywhere
          e.preventDefault();

          // Log the user out
          app.logUserOut();
        });
  }
};

// Log the user out then redirect them
app.logUserOut = function(redirectUser) {
  // Set redirectUser to default to true
  redirectUser = typeof redirectUser == "boolean" ? redirectUser : true;

  // Get the current token id
  var tokenId =
    typeof app.config.sessionToken.id == "string"
      ? app.config.sessionToken.id
      : false;

  // Send the current token to the tokens endpoint to delete it
  var queryStringObject = {
    id: tokenId
  };
  app.client.request(
    undefined,
    "/api/tokens",
    "DELETE",
    queryStringObject,
    undefined,
    function(statusCode, responsePayload) {
      // Set the app.config token as false
      app.setSessionToken(false);

      // Send the user to the logged out page
      if (redirectUser) {
        window.location = "/session/deleted";
      }
    }
  );
};

// Bind the forms
app.bindForms = function() {
  if (document.querySelector("form")) {
    var allForms = document.querySelectorAll("form");
    for (var i = 0; i < allForms.length; i++) {
      allForms[i].addEventListener("submit", function(e) {
        // Stop it from submitting
        e.preventDefault();
        var formId = this.id;
        var path = this.action;
        var method = this.method.toUpperCase();

        // Hide the error message (if it's currently shown due to a previous error)
        if (formId) {
          document.querySelector("#" + formId + " .formError").style.display =
            "none";

          // Hide the success message (if it's currently shown due to a previous error)
          if (document.querySelector("#" + formId + " .formSuccess")) {
            document.querySelector(
              "#" + formId + " .formSuccess"
            ).style.display =
              "none";
          }
        }

        // Turn the inputs into a payload
        var payload = {};
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
          if (elements[i].type !== "submit") {
            // Determine class of element and set value accordingly
            var classOfElement =
              typeof elements[i].classList.value == "string" &&
              elements[i].classList.value.length > 0
                ? elements[i].classList.value
                : "";
            var valueOfElement =
              elements[i].type == "checkbox" &&
              classOfElement.indexOf("multiselect") == -1
                ? elements[i].checked
                : classOfElement.indexOf("intval") == -1
                  ? elements[i].value
                  : parseInt(elements[i].value);
            var elementIsChecked = elements[i].checked;
            // Override the method of the form if the input's name is _method
            var nameOfElement = elements[i].name;
            if (nameOfElement == "_method") {
              method = valueOfElement;
            } else {
              // Create an payload field named "method" if the elements name is actually httpmethod
              if (nameOfElement == "httpmethod") {
                nameOfElement = "method";
              }
              // Create an payload field named "id" if the elements name is actually uid
              if (nameOfElement == "uid") {
                nameOfElement = "id";
              }
              // If the element has the class "multiselect" add its value(s) as array elements
              if (classOfElement.indexOf("multiselect") > -1) {
                if (elementIsChecked) {
                  payload[nameOfElement] =
                    typeof payload[nameOfElement] == "object" &&
                    payload[nameOfElement] instanceof Array
                      ? payload[nameOfElement]
                      : [];
                  payload[nameOfElement].push(valueOfElement);
                }
              } else {
                payload[nameOfElement] = valueOfElement;
              }
            }
          }
        }

        // If the method is DELETE, the payload should be a queryStringObject instead
        var queryStringObject = method == "DELETE" ? payload : {};

        // Call the API
        app.client.request(
          undefined,
          path,
          method,
          queryStringObject,
          payload,
          function(statusCode, responsePayload) {
            // Display an error on the form if needed
            if (statusCode !== 200) {
              if (statusCode == 403) {
                // log the user out
                app.logUserOut();
              } else {
                if (!formId) return;
                // Try to get the error from the api, or set a default error message
                var error =
                  typeof responsePayload.Error == "string"
                    ? responsePayload.Error
                    : "An error has occured, please try again";

                // Set the formError field with the error text
                document.querySelector(
                  "#" + formId + " .formError"
                ).innerHTML = error;

                // Show (unhide) the form error field on the form
                document.querySelector(
                  "#" + formId + " .formError"
                ).style.display =
                  "block";
              }
            } else {
              // If successful, send to form response processor
              app.formResponseProcessor(formId, payload, responsePayload);
            }
          }
        );
      });
    }
  }
};

// Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload) {
  var functionToCall = false;
  // If account creation was successful, try to immediately log the user in
  if (formId == "register") {
    // Take the email and password, and use it to log the user in
    var newPayload = {
      email: requestPayload.email,
      password: requestPayload.password
    };

    app.client.request(
      undefined,
      "/api/tokens",
      "POST",
      undefined,
      newPayload,
      function(newStatusCode, newResponsePayload) {
        // Display an error on the form if needed
        if (newStatusCode !== 200) {
          // Set the formError field with the error text
          document.querySelector("#" + formId + " .formError").innerHTML =
            "Sorry, an error has occured. Please try again.";

          // Show (unhide) the form error field on the form
          document.querySelector("#" + formId + " .formError").style.display =
            "block";
        } else {
          // If successful, set the token and redirect the user
          app.setSessionToken(newResponsePayload);
          window.location = "/";
        }
      }
    );
  }
  // If login was successful, set the token in localstorage and redirect the user
  if (formId == "login") {
    app.setSessionToken(responsePayload);
    window.location = "/";
  }

  // If forms saved successfully and they have success messages, show them
  var formsWithSuccessMessages = [
    "accountEdit1",
    "accountEdit2",
    "checksEdit1"
  ];
  if (formsWithSuccessMessages.indexOf(formId) > -1) {
    document.querySelector("#" + formId + " .formSuccess").style.display =
      "block";
  }

  // If the user just deleted their account, redirect them to the account-delete page
  if (formId == "accountEdit3") {
    app.logUserOut(false);
    window.location = "/account/deleted";
  }
};

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function() {
  var tokenString = localStorage.getItem("token");
  if (typeof tokenString == "string") {
    try {
      var token = JSON.parse(tokenString);
      app.config.sessionToken = token;
      console.log(app.config.sessionToken);
      if (typeof token == "object") {
        app.setLoggedInClass(true);
      } else {
        app.setLoggedInClass(false);
      }
    } catch (e) {
      app.config.sessionToken = false;
      app.setLoggedInClass(false);
    }
  }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add) {
  var target = document.querySelector("body");
  if (add) {
    target.classList.add("loggedIn");
  } else {
    target.classList.remove("loggedIn");
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token) {
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem("token", tokenString);
  if (typeof token == "object") {
    app.setLoggedInClass(true);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback) {
  var currentToken =
    typeof app.config.sessionToken == "object"
      ? app.config.sessionToken
      : false;
  if (currentToken) {
    // Update the token with a new expiration
    var payload = {
      id: currentToken.id,
      extend: true
    };
    app.client.request(
      undefined,
      "/api/tokens",
      "PUT",
      undefined,
      payload,
      function(statusCode, responsePayload) {
        // Display an error on the form if needed
        if (statusCode == 200) {
          // Get the new token details
          var queryStringObject = { id: currentToken.id };
          app.client.request(
            undefined,
            "/api/tokens",
            "GET",
            queryStringObject,
            undefined,
            function(statusCode, responsePayload) {
              // Display an error on the form if needed
              if (statusCode == 200) {
                app.setSessionToken(responsePayload);
                callback(false);
              } else {
                app.setSessionToken(false);
                callback(true);
              }
            }
          );
        } else {
          app.setSessionToken(false);
          callback(true);
        }
      }
    );
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = function() {
  // Get the current page from the body class
  var bodyClasses = document.querySelector("#dataClass").classList;
  var primaryClass = typeof bodyClasses[0] == "string" ? bodyClasses[0] : false;

  // Logic for account settings page
  if (primaryClass == "accountEdit") {
    app.loadAccountEditPage();
  }

  // Logic for menus page
  if (primaryClass == "pizzamenus") {
    app.loadMenusPage();
  }

  // Logic for cart page
  if (primaryClass == "cart") {
    app.loadCartPage();
  }

  // Logic for checkout page
  if (primaryClass == "checkout") {
    app.loadCartPage();
    app.loadCheckoutPage();
  }
};

// Load the account edit page specifically
app.loadAccountEditPage = function() {
  var email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // Fetch the user data
    var queryStringObject = {
      email
    };
    app.client.request(
      undefined,
      "api/users",
      "GET",
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode == 200) {
          // Put the data into the forms as values where needed
          document.querySelector("#accountEdit1 .firstNameInput").value =
            responsePayload.firstName;
          document.querySelector("#accountEdit1 .lastNameInput").value =
            responsePayload.lastName;
          document.querySelector("#accountEdit1 .emailInput").value =
            responsePayload.email;
          document.querySelector("#accountEdit1 .phoneInput").value =
            responsePayload.phone;
          document.querySelector("#accountEdit1 .addressInput").value =
            responsePayload.address;

          // Put the hidden email field into both forms
          var hiddenEmailInput = document.querySelectorAll(
            "input.hiddenEmailInput"
          );
          for (var i = 0; i < hiddenEmailInput.length; i++) {
            hiddenEmailInput[i].value = responsePayload.email;
          }
        } else {
          // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
          app.logUserOut();
        }
      }
    );
  } else {
    app.logUserOut();
  }
};

// Load the menus page specifically
app.loadMenusPage = function() {
  const email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // Fetch the user data
    var queryStringObject = {
      email
    };
    app.client.request(
      undefined,
      "api/foods",
      "GET",
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        if (statusCode == 200) {

          var menuListing = '';
          for (let key in responsePayload) {
            var food = responsePayload[key];
            if (responsePayload.hasOwnProperty(key)){
              menuListing += '<div class="w3-menu-grids" style="margin-bottom: 14px;">'+
            			'<div class="w3-menu-grid1">'+
            				'<div class="col-md-8 w3-menu1-left food-info">'+
            					'<h4><sup><span>#'+food.price+'</span></sup></h4>'+
            					'<h3> '+food.name+' </h3>'+
            					'<p>best of  '+food.name+'</p>'+
            					'<input type="number" id="quantity-'+food.id+'" name="quantity" placeholder="specify quantity" />'+
            					'<a href="#" data-id="'+food.id+'" class="add-to-cart-link">Add to cart</a>'+
            				'</div>'+
                    '<div class="col-md-4 food-img">'+
            				'<div class="clearfix"></div>'+
            				'<div class="w3-position-menu-img">'+
            				'<img src="public/images/'+food.image+'" alt="img">'+
            				'</div>'+
            			'</div>'+
            		'</div>';
            }
          }

          document.querySelector('#menuListing').innerHTML = menuListing;
          const addToCartButton = document.querySelectorAll(
            "a.add-to-cart-link"
          );
          for (var i = 0; i < addToCartButton.length; i++) {
            addToCartButton[i].addEventListener("click", function(e) {
              e.preventDefault();
              const menuId = parseInt(e.target.dataset.id);
              console.log(menuId);
              const quantity = parseInt(
                document.getElementById("quantity-" + menuId).value
              );
              const payload = {
                item: menuId,
                quantity,
                email
              };
              app.client.request(
                undefined,
                "api/cart",
                "POST",
                undefined,
                payload,
                function(statusCode, responsePayload) {
                  if (statusCode == 200) {
                    alert("Item has been added to your cart");
                  } else {
                    alert(responsePayload.Error);
                  }
                }
              );
            });
          }
        } else {
          // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
          app.logUserOut();
        }
      }
    );
  } else {
    app.logUserOut();
  }
};

// Available menu
const listOfMenu = {
  1: {
    name: "Black Pizza",
    price: 2.99,
    description: "Black Pizza"
  },
  2: {
    name: "White Pizzaa.",
    price: 4.99,
    description: "White Pizza"
  },
  3: {
    name: "Yellow Pizza",
    price: 5.99,
    description:
      "Yellow Pizza"
  },
  4: {
    name: "Rowdy Pizza",
    price: 6.99,
    description: "Rowdy Pizza"
  },
  5: {
    name: "Frutti pizza.",
    price: 4.99,
    description: "Frutti pizza"
  }
};

// Load the cart page specifically
app.loadCartPage = function() {
  console.log(app.config);
  const email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    // Fetch the user data
    var queryStringObject = {
      email
    };
    app.client.request(
      undefined,
      "/api/cart",
      "GET",
      queryStringObject,
      undefined,
      function(statusCode, responsePayload) {
        response = responsePayload.cartItems;
        if (statusCode == 200) {
          console.log(response);
          console.log(typeof response.length);
          if (response.length == 1) {
            document.getElementById("cartTable").remove();
            const c = document.getElementById("cartContainer");
            c.innerHTML = `<div class="blurb">Your cart is empty</div>`;
          } else {
            const table = document.getElementById("cartTable");
            table.style.display = "table";
            for (var key = 0, l = response.length; key < l; key++) {
              console.log(response);
              let tr = table.insertRow(parseInt(key) + 1);
              tr.classList.add("checkRow");
              if (response[key].total !== undefined) {
                let td0 = tr.insertCell(0);
                td0.colSpan = 5;
                td0.innerHTML = "TOTAL: $" + response[key].total;
              } else {
                let td0 = tr.insertCell(0);
                let td1 = tr.insertCell(1);
                let td2 = tr.insertCell(2);
                let td3 = tr.insertCell(3);
                td0.innerHTML = response[key].item.name;
                td1.innerHTML = response[key].quantity;
                console.log("----------------");
                console.log(response[key].id);
                td2.innerHTML =
                  "$" + (response[key].item.price * response[key].quantity);
                td3.innerHTML = `<a href="#" class="cart-remove" data-id="${
                  response[key].id
                }">Remove</a>`;
                const cartRemove = document.querySelectorAll("a.cart-remove");
                for (var i = 0; i < cartRemove.length; i++) {
                  cartRemove[i].addEventListener("click", function(e) {
                    e.preventDefault();
                    const menuId = e.target.dataset.id;
                    const payload = {
                      id:menuId,
                      email
                    };
                    app.client.request(
                      undefined,
                      "/api/cart",
                      "DELETE",
                      undefined,
                      payload,
                      function(statusCode, responsePayload) {
                        if (statusCode == 200) {
                          window.location = "/cart/items";
                        }
                      }
                    );
                  });
                }
              }

            }
          }
        } else {
          // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
          // app.logUserOut();
          document.getElementById("cartTable").remove();
          const c = document.getElementById("cartContainer");
          c.innerHTML = `<div class="blurb">Your cart is empty</div>`;
        }
      }
    );
  } else {
    app.logUserOut();
  }
};

// Load the checkout page specifically
app.loadCheckoutPage = function() {
  const email =
    typeof app.config.sessionToken.email == "string"
      ? app.config.sessionToken.email
      : false;
  if (email) {
    document.getElementById("ccSubmit").addEventListener("click", function(e) {
      alert("Please wait while we submit your payment");
      const validCC = [
        "4242424242424242",
        "4000056655665556",
        "5555555555554444",
        "2223003122003222",
        "5200828282828210",
        "5105105105105100",
        "378282246310005",
        "371449635398431",
        "6011111111111117",
        "6011000990139424",
        "30569309025904",
        "38520000023237",
        "3566002020360505",
        "6200000000000005"
      ];
      const ccNumber = document.getElementById("ccNumber").value;
      const ccToken = document.getElementById("cardType").value;

      if (validCC.indexOf(ccNumber) > -1) {
        // Fetch the user data
        var payload = {
          email,
          cc: ccToken
        };
        app.client.request(
          undefined,
          "/api/orders",
          "POST",
          undefined,
          payload,
          function(statusCode, responsePayload) {
            if (statusCode == 200) {
              alert("Payment completed!");
              window.location = "/view/menus";
            } else {
              alert(responsePayload.Error);
            }
          }
        );
      } else {
        alert("Credit card number not valid");
      }
    });
  } else {
    app.logUserOut();
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function() {
  setInterval(function() {
    app.renewToken(function(err) {
      if (!err) {
        console.log("Token renewed successfully @ " + Date.now());
      }
    });
  }, 1000 * 60);
};


// redirect user to authentication page on request
app.redirectToLoginPage = function(){
  app.getSessionToken();
  if (!app.config.sessionToken) {
    window.location = '/login';
  }
};

// Init (bootstrapping)
app.init = function() {
  // Bind all form submissions
  app.bindForms();

  // Bind logout logout button
  app.bindLogoutButton();

  // Get the token from localstorage
  app.getSessionToken();

  // Renew token
  app.tokenRenewalLoop();

  // Load data on page
  app.loadDataOnPage();
};

// Call the init processes after the window loads
window.onload = function() {
  app.init();
};
