"use strict";
(function() {
  window.addEventListener("load", init);

  let sessionId = null;

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
    id('profile-link').addEventListener('click', loadProfile);
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
          id('items-list').appendChild(createItemElement(item));
        });
      })
      .catch(console.error);
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
    img.alt = item.name;
    img.style.width = "100%";

    const nameP = document.createElement('p');
    nameP.textContent = item.name;
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
    const detailSection = document.createElement('div');
    detailSection.innerHTML = `
      <h2>${item.name}</h2>
      <img src="${item.image}" alt="${item.name}" style="max-width: 90%; height: auto;">
      <p>${item.description}</p>
      <button onclick="showSection('home-content')">Back to Listings</button>
    `;
    const content = id('content');
    content.innerHTML = '';
    content.appendChild(detailSection);
    content.style.display = 'block';
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
    // id('home-content').innerHTML('').
    // fetch('marketplace')
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
          contact: "user@example.com" // replace with actual user contact info
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
        .catch(console.error);
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
        loadProfile();
      })
      .catch(console.error);
    });
  }

  /**
   * Loads the profile of the logged-in user.
   */
  function loadProfile() {
    if (!sessionId) {
      // Show login section if not logged in
      showSection('profile-content');
      id('login-section').style.display = 'block';
      id('user-info').style.display = 'none';
      id('user-listings').style.display = 'none';
      return;
    }

    fetch(`/account?userId=1`, { // replace 1 with actual user ID from session
      headers: {
        'x-session-id': sessionId
      }
    })
    .then(checkStatus)
    .then(resp => resp.json())
    .then(profile => {
      id('username-display').textContent = `Username: ${profile.user.email}`;
      id('email-display').textContent = `Email: ${profile.user.email}`;
      const userListingSection = id('user-listings');
      userListingSection.innerHTML = '';
      profile.listings.forEach(listing => {
        userListingSection.appendChild(createItemElement(listing));
      });
      showSection('profile-content');
      id('login-section').style.display = 'none';
      id('user-info').style.display = 'block';
      id('user-listings').style.display = 'block';
    })
    .catch(console.error);
  }

  /**
   * Checks the login status and shows the appropriate sections.
   */
  function checkLoginStatus() {
    if (!sessionId) {
      showSection('profile-content');
      id('login-section').style.display = 'block';
      id('user-info').style.display = 'none';
      id('user-listings').style.display = 'none';
    } else {
      showSection('home-content');
    }
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
