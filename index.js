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
    document.getElementById('home-link').addEventListener('click', () =>
      showSection('home-content'));
    document.getElementById('upload-link').addEventListener('click', () =>
      showSection('upload-content'));
    document.getElementById('profile-link').addEventListener('click', () =>
      showSection('profile-content'));
  }

  /**
   * Binds event listener for the filter.
   */
  function bindFilter() {
    document.getElementById('type-filter').addEventListener('change', filterItems);
  }

  /**
   * Displays the specified section while hiding others.
   * @param {string} sectionId - The id of the section to display.
   */
  function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
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
      document.getElementById('items-list').appendChild(createItemElement(item));
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
    const content = document.getElementById('content');
    content.innerHTML = '';
    content.appendChild(detailSection);
    content.style.display = 'block';
  }

  /**
   * Filters items based on the selected filter option.
   */
  function filterItems() {
    const filter = document.getElementById('type-filter').value;
    const items = document.querySelectorAll('#items-list .item');
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
    document.getElementById('upload-form').addEventListener('submit', function(event) {
      event.preventDefault();
      const reader = new FileReader();
      reader.onload = function(img) {
        const newItem = {
          type: document.getElementById('type').value,
          name: document.getElementById('name').value,
          description: document.getElementById('description').value,
          imageUrl: img.target.result
        };
        document.getElementById('items-list').appendChild(createItemElement(newItem));
        showSection('profile-content');
      };
      const imageFile = document.getElementById('image').files[0];
      if (imageFile) {
        reader.readAsDataURL(imageFile);
      } else {
        reader.onload({target: {result: 'img/stockphoto.jpeg'}});
      }
    });
  }
})();