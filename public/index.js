"use strict";
(function() {
  window.addEventListener("load", init);

  let sessionId = null;
  let userId = null; // Store user ID here

  /**
   * Initializes the application.
   */
  function init() {
    setupNavigation();
    bindFilter();
    setupFormListeners();
    loadItems();
    checkLoginStatus();
  }

  /**
   * Sets up the navigation event listeners.
   */
  function setupNavigation() {
    id('home-link').addEventListener('click', () => showSection('home-content'));
    id('upload-link').addEventListener('click', () => showSection('upload-content'));
    id('profile-link').addEventListener('click', () => showSection('profile-content'));
    id('create-account-link').addEventListener('click', () => showSection('register-content'));
    id('back-to-login-link').addEventListener('click', () => showSection('profile-content'));
  }

  /**
   * Binds the filter change event listener.
   */
  function bindFilter() {
    id('type-filter').addEventListener('change', filterItems);
  }

  /**
   * Shows the specified section and hides others.
   * @param {string} sectionId - The ID of the section to show.
   */
  function showSection(sectionId) {
    qsa('.content-section').forEach(section => {
      section.style.display = 'none';
    });
    const section = id(sectionId);
    if (section) {
      section.style.display = 'block';
    } else {
      console.error(`Section with ID ${sectionId} not found.`);
    }
  }

  function showSectionById(sectionId) {
    const section = id(sectionId);
    if (section) {
      section.style.display = 'block';
    } else {
      section.style.display = "none";
      console.error(`Section with ID ${sectionId} not found.`);
    }
  }

  /**
   * Loads the items from the marketplace.
   */
  function loadItems() {
    fetch('/marketplace')
      .then(checkStatus)
      .then(resp => resp.json())
      .then(items => {
        id('items-list').innerHTML = '';
        items.forEach(item => {
          const itemElement = createItemElement(item);
          itemElement.addEventListener('click', () => {
            fetch(`/listing/item?id=${item.id}`)
              .then(checkStatus)
              .then(resp => resp.json())
              .then(showItemDetails)
              .catch(handleError);
          });
          id('items-list').appendChild(itemElement);
        });
      })
      .catch(handleError);
  }

  /**
   * Creates an item element.
   * @param {Object} item - The item object.
   * @returns {HTMLElement} The created item element.
   */
  function createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = item.category;
    div.onclick = () => showItemDetails(item);

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.style.width = "100%";

    const nameP = document.createElement('p');
    nameP.textContent = item.title;
    nameP.style.textAlign = 'center';

    div.appendChild(img);
    div.appendChild(nameP);
    return div;
  }

/**
 * Shows the details of the specified item.
 * @param {Object} item - The item object.
 */
function showItemDetails(item) {
  id('listing-title').textContent = item.title;
  id('listing-image').src = item.image;
  id('listing-image').alt = item.title;
  id('listing-description').textContent = `Description: ${item.description}`;
  id('listing-price').textContent = `Price: $${item.price}`;
  id('listing-contact').textContent = `Contact: ${item.contact}`;
  id('listing-seller-email').textContent = `Sold by: ${item.sellerEmail}`;

  showSection('listing-content');
  document.getElementById('back-to-listings').addEventListener('click', () => {
    showSection('home-content');
  });
}



  /**
   * Filters the items based on the selected filter.
   */
  function filterItems() {
    const filter = id('type-filter').value;
    const items = qsa('#items-list .item');
    items.forEach(item => {
      if (filter === 'all' || item.dataset.type === filter) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Sets up the form listeners for handling form submissions.
   */
  function setupFormListeners() {
    id('upload-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const reader = new FileReader();
      reader.onload = function(img) {
        const newItem = {
          title: id('name').value,
          category: id('type').value,
          description: id('description').value,
          image: img.target.result,
          contact: id('contact').value, // replace with actual user contact info
          price: parseFloat(id('price').value) // Ensure price is a number
        };
        fetch('/upload/item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          },
          body: JSON.stringify(newItem)
        })
        .then(checkStatus)
        .then(resp => resp.json())
        .then(() => {
          id('items-list').appendChild(createItemElement(newItem));
          loadProfile();
        })
        .catch(handleError);
      };
      const imageFile = id('image').files[0];
      if (imageFile) {
        reader.readAsDataURL(imageFile);
      } else {
        reader.onload({target: {result: 'img/stockphoto.jpeg'}});
      }
    });

    id('login-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const email = id('login-email').value;
      const password = id('login-password').value;
      fetch('/userauth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(checkStatus)
      .then(resp => resp.json())
      .then(data => {
        sessionId = data.sessionId;
        userId = data.userId; // Ensure userId is set here
        loadProfile();
      })
      .catch(handleError);
    });

    id('register-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const email = id('register-email').value;
      const password = id('register-password').value;
      fetch('/userauth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(checkStatus)
      .then(resp => resp.json())
      .then(data => {
        showMessage('Successfully created account!', 'success');
        showSection('profile-content');
      })
      .catch(err => {
        handleError(err);
        showMessage('Failed to create account. Please try again.', 'error');
      });
    });
  }

/**
 * Loads the profile of the logged-in user.
 */
function loadProfile() {
  console.log("first line")
  if (!userId) {
    // Show login section if not logged in
    showSectionById('profile-content');
    id('login-section').style.display = 'none';
    id('user-info').style.display = 'block';
    id('user-listings').style.display = 'block';
    return;
  }
  console.log("hellow world");
  fetch(`/account`, { // No need to pass userId as it's determined from session
    headers: {
      'x-session-id': sessionId
    }
  })
  .then(checkStatus)
  .then(resp => resp.json())
  .then(profile => {
    id('email-display').textContent = `Email: ${profile.user.email}`;
    const userListingSection = id('user-listings').querySelector('.items-list');
    userListingSection.innerHTML = '';

    profile.listings.forEach(item => {
      const itemElement = createItemElement(item);
      itemElement.addEventListener('click', () => {
        fetch(`/listing/item?id=${item.id}`)
          .then(checkStatus)
          .then(resp => resp.json())
          .then(showItemDetails)
          .catch(handleError);
      });
      userListingSection.appendChild(itemElement);
    });

    showSection('profile-content');
    id('login-section').style.display = 'none';
    id('user-info').style.display = 'block';
    id('user-listings').style.display = 'block';
    console.log("end");
  })
  .catch(handleError);
}

  /**
   * Checks the login status and shows the appropriate sections.
   */
  function checkLoginStatus() {
    if (!userId) {
      showSectionById('profile-content');
      id('login-section').style.display = 'block';
      id('user-info').style.display = 'none';
      id('user-listings').style.display = 'none';
    } else {
      showSection('home-content');
    }
  }

  /**
   * Displays a message in the page's designated message area.
   * Adjusts styling based on the message type ('success' or 'error').
   *
   * @param {string} message - The message to display.
   * @param {string} type - The type of the message ('success' or 'error').
   */
  function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `notification ${type}`; // Apply appropriate class for styling
    messageDiv.style.display = 'block'; // Show the message

    // Automatically hide the message after 5 seconds
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }

  /**
   * Specialized function to handle errors by displaying them using the showMessage function.
   *
   * @param {Error} error - The error object to process.
   */
  function handleError(error) {
    console.error("Error:", error);
    showMessage(`An error occurred: ${error.message}`, 'error');
  }

  /**
   * Checks the response status and throws an error if the response is not OK.
   * @param {Response} response - The fetch response object.
   * @returns {Response} The response if it is OK.
   */
  function checkStatus(response) {
    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    return response;
  }

  /**
   * Gets an element by its ID.
   * @param {string} name - The ID of the element.
   * @returns {HTMLElement} The element with the specified ID.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Gets all elements that match the specified selector.
   * @param {string} selector - The CSS selector.
   * @returns {NodeList} A NodeList of elements that match the selector.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();