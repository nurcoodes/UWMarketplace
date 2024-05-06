"use strict";
(function() {
  window.addEventListener("load", init);

  /**
   * Initializes the application.
   */
  function init() {
    setupNavigation();
    bindFilter();
    setupFormListeners();
    generateTestItems();
    showSection('home-content');
  }

  /**
   * Sets up navigation links.
   */
  function setupNavigation() {
    id('home-link').addEventListener('click', () => showSection('home-content'));
    id('upload-link').addEventListener('click', () => showSection('upload-content'));
    id('profile-link').addEventListener('click', () => showSection('profile-content'));
  }

  /**
   * Binds event listener for the filter.
   */
  function bindFilter() {
    id('type-filter').addEventListener('change', filterItems);
  }

  /**
   * Displays the specified section while hiding others.
   * @param {string} sectionId - The id of the section to display.
   */
  function showSection(sectionId) {
    qsa('.content-section').forEach(section => {
      section.style.display = 'none';
    });
    id(sectionId).style.display = 'block';
  }

  /**
   * Generates test items and appends them to the items list.
   */
  function generateTestItems() {
    const items = [
      {type: 'electronics', name: 'Macbook Air', description: 'A sleek and powerful laptop.',
        imageUrl: 'img/stockphoto.jpeg'},
      {type: 'home', name: 'Old Sofa', description: 'Comfortable but old.',
        imageUrl: 'img/stockphoto.jpeg'},
      {type: 'clothing', name: 'Lakers Jersey', description: 'Original Lakers Jersey.',
        imageUrl: 'img/stockphoto.jpeg'},
      {type: 'all', name: 'Electric Guitar', description: 'A high-quality electric guitar.',
        imageUrl: 'img/stockphoto.jpeg'}
    ];
    items.forEach(item => {
      id('items-list').appendChild(createItemElement(item));
    });
  }

  /**
   * Creates a new item element.
   * @param {Object} item - The item object containing information about the item.
   * @returns {HTMLElement} - The newly created item element.
   */
  function createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.type = item.type; // Store type for filtering
    div.onclick = () => showItemDetails(item);

    const img = document.createElement('img');
    img.src = item.imageUrl;
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
   * Displays details of the selected item.
   * @param {Object} item - The item object to display details for.
   */
  function showItemDetails(item) {
    const detailSection = document.createElement('div');
    detailSection.innerHTML = `
      <h2>${item.name}</h2>
      <img src="${item.imageUrl}" alt="${item.name}" style="max-width: 90%; height: auto;">
      <p>${item.description}</p>
      <button onclick="showSection('home-content')">Back to Listings</button>
    `;
    const content = id('content');
    content.innerHTML = '';
    content.appendChild(detailSection);
    content.style.display = 'block';
  }

  /**
   * Filters items based on the selected filter option.
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
   * Sets up form listeners for handling form submissions.
   */
  function setupFormListeners() {
    id('upload-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const reader = new FileReader();
      reader.onload = function(img) {
        const newItem = {
          type: id('type').value,
          name: id('name').value,
          description: id('description').value,
          imageUrl: img.target.result
        };
        id('items-list').appendChild(createItemElement(newItem));
        showSection('profile-content');
      };
      const imageFile = id('image').files[0];
      if (imageFile) {
        reader.readAsDataURL(imageFile);
      } else {
        reader.onload({target: {result: 'img/stockphoto.jpeg'}});
      }
    });
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} name - element ID.
   * @returns {object} - DOM object associated with id.
   */
  function id(name) {
    return document.getElementById(name);
  }

  /**
   * Returns an array of elements matching the given query.
   * @param {string} selector - CSS query selector.
   * @returns {array} - Array of DOM objects matching the given query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();