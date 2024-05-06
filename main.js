"use strict";
(function() {
  window.addEventListener("load", init);

  function init() {
    setupNavigation();
    bindFilter();
    setupFormListeners();
    generateTestItems();
    showSection('homeContent');
  }

  function setupNavigation() {
    document.getElementById('homeLink').addEventListener('click', () => showSection('homeContent'));
    document.getElementById('uploadLink').addEventListener('click', () => showSection('uploadContent'));
    document.getElementById('profileLink').addEventListener('click', () => showSection('profileContent'));
  }

  function bindFilter() {
    document.getElementById('typeFilter').addEventListener('change', filterItems);
  }

  function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
      section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
  }

  function generateTestItems() {
    const items = [
      { type: 'electronics', name: 'Macbook Air', description: 'A sleek and powerful laptop.', imageUrl: 'img/stockphoto.jpeg' },
      { type: 'home', name: 'Old Sofa', description: 'Comfortable but old.', imageUrl: 'img/stockphoto.jpeg' },
      { type: 'clothing', name: 'Lakers Jersey', description: 'Original Lakers Jersey.', imageUrl: 'img/stockphoto.jpeg' },
      { type: 'all', name: 'Electric Guitar', description: 'A high-quality electric guitar.', imageUrl: 'img/stockphoto.jpeg' }
    ];
    items.forEach(item => {
      document.getElementById('itemsList').appendChild(createItemElement(item));
    });
  }

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

  function showItemDetails(item) {
    const detailSection = document.createElement('div');
    detailSection.innerHTML = `
      <h2>${item.name}</h2>
      <img src="${item.imageUrl}" alt="${item.name}" style="max-width: 90%; height: auto;">
      <p>${item.description}</p>
      <button onclick="showSection('homeContent')">Back to Listings</button>
    `;
    const content = document.getElementById('content');
    content.innerHTML = '';
    content.appendChild(detailSection);
    content.style.display = 'block';
  }  

  function filterItems() {
    const filter = document.getElementById('typeFilter').value;
    const items = document.querySelectorAll('#itemsList .item');
    items.forEach(item => {
      if (filter === 'all' || item.dataset.type === filter) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  function setupFormListeners() {
    document.getElementById('uploadForm').addEventListener('submit', function(event) {
      event.preventDefault();
      const reader = new FileReader();
      reader.onload = function(e) {
        const newItem = {
          type: document.getElementById('type').value,
          name: document.getElementById('name').value,
          description: document.getElementById('description').value,
          imageUrl: e.target.result  // Image data URL
        };
        document.getElementById('itemsList').appendChild(createItemElement(newItem));
        showSection('profileContent');
      };
      const imageFile = document.getElementById('image').files[0];
      if (imageFile) {
        reader.readAsDataURL(imageFile);
      } else {
        reader.onload({target: {result: 'img/stockphoto.jpeg'}});  // Use default image if no file is selected
      }
    });
  }
})();