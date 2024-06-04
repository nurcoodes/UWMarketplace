"use strict";
(function() {
  window.addEventListener("load", init);

  let sessionId = null;
  let userId = null; // Store user ID here
  let confirmedTransaction = null;

  /**
   * Initializes the application.
   */
  function init() {
    setupNavigation();
    bindFilter();
    bindSearch();
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
   * Binds the search input event listener.
   */
  function bindSearch() {
    id('search-bar').addEventListener('input', filterItems);
  }
  
  /**
   * Filters the items based on the selected filter and search query.
   */
  function filterItems() {
    const filter = id('type-filter').value;
    const searchQuery = id('search-bar').value.toLowerCase();
    const items = qsa('#items-list .item');
    
    items.forEach(item => {
      const itemType = item.dataset.type;
      const itemName = item.querySelector('p').textContent.toLowerCase();
      
      const matchesFilter = (filter === 'all' || itemType === filter);
      const matchesSearch = itemName.includes(searchQuery);
  
      if (matchesFilter && matchesSearch) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
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
  
    const transactionButton = id('transaction-button');
  
    if (item.isSold === 1) {
      transactionButton.style.display = 'none';
      showMessage('This item has already been sold.', 'error');
    } else {
      if (!userId) { // Check if the user is logged in
        transactionButton.style.display = 'none';
        showMessage('Please log in to make a purchase.', 'error');
      } else {
        transactionButton.style.display = 'block';
        transactionButton.textContent = 'Confirm Purchase';
        transactionButton.onclick = () => handleTransactionButtonClick(item);
      }
    }
  
    showSection('listing-content');
    document.getElementById('back-to-listings').addEventListener('click', () => {
      showSection('home-content');
    });
  }
  
  function handleTransactionButtonClick(item) {
    const transactionButton = id('transaction-button');
    const confirmationMessage = id('confirmation-message');
  
    if (transactionButton.textContent === 'Confirm Purchase') {
      confirmedTransaction = {
        buyerId: userId,
        sellerId: item.userId,
        itemId: item.id,
        price: item.price
      };
      confirmationMessage.textContent = 'Transaction confirmed. Please submit to proceed.';
      confirmationMessage.style.display = 'block';
      transactionButton.textContent = 'Submit Purchase';
    } else if (transactionButton.textContent === 'Submit Purchase') {
      if (!confirmedTransaction) {
        showMessage('Please confirm the transaction before submitting.', 'error');
        return;
      }
      submitTransaction();
    }
  }
  
  function submitTransaction() {
    fetch('/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify(confirmedTransaction)
    })
    .then(checkStatus)
    .then(resp => resp.json())
    .then(data => {
      if (data.success) {
        showMessage(`Transaction successful! Your confirmation number is ${data.confirmationNumber}`, 'success');
        markItemAsSold(confirmedTransaction.itemId);
        updatePurchaseHistory();
      } else {
        showMessage(`Transaction failed: ${data.message}`, 'error');
      }
      id('transaction-button').textContent = 'Confirm Purchase';
      id('confirmation-message').style.display = 'none';
    })
    .catch(handleError);
  }

  function updatePurchaseHistory() {
    fetch(`/account`, {
      headers: {
        'x-session-id': sessionId
      }
    })
    .then(checkStatus)
    .then(resp => resp.json())
    .then(profile => {
      const purchaseHistorySection = id('purchase-history');
      purchaseHistorySection.innerHTML = '';
  
      profile.purchases.forEach(purchase => {
        const purchaseElement = document.createElement('div');
        purchaseElement.className = 'purchase';
        purchaseElement.textContent = `${purchase.itemTitle} - $${purchase.price}`;
        purchaseHistorySection.appendChild(purchaseElement);
      });
    })
    .catch(handleError);
  }

  function markItemAsSold(itemId) {
    const itemElement = document.querySelector(`.item[data-id='${itemId}']`);
    if (itemElement) {
      itemElement.classList.add('sold');
      const buyButton = id('buy-listing');
      if (buyButton) {
        buyButton.style.display = 'none';
      }
    }
  }


  function setupUploadFormListener() {
    id('upload-form').addEventListener('submit', handleUploadFormSubmit);
  }
  
  function handleUploadFormSubmit(event) {
    event.preventDefault();
    const reader = new FileReader();
    reader.onload = handleImageLoad;
    const imageFile = id('image').files[0];
    if (imageFile) {
      reader.readAsDataURL(imageFile);
    } else {
      handleImageLoad({ target: { result: 'img/stockphoto.jpeg' } });
    }
  }
  
  function handleImageLoad(img) {
    const newItem = {
      title: id('name').value,
      category: id('type').value,
      description: id('description').value,
      image: img.target.result,
      contact: id('contact').value,
      price: parseFloat(id('price').value)
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
    .then(handleUploadSuccess)
    .catch(handleError);
  }
  
  function handleUploadSuccess() {
    id('items-list').appendChild(createItemElement(newItem));
    loadProfile();
  }
  
  function setupLoginFormListener() {
    id('login-form').addEventListener('submit', handleLoginFormSubmit);
  }
  
  function handleLoginFormSubmit(event) {
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
    .then(handleLoginSuccess)
    .catch(handleError);
  }
  
  function handleLoginSuccess(data) {
    sessionId = data.sessionId;
    userId = data.userId;
    loadProfile();
  }
  
  function setupRegisterFormListener() {
    id('register-form').addEventListener('submit', handleRegisterFormSubmit);
  }
  
  function handleRegisterFormSubmit(event) {
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
    .then(handleRegisterSuccess)
    .catch(handleError);
  }
  
  function handleRegisterSuccess() {
    showMessage('Successfully created account!', 'success');
    showSection('profile-content');
  }
  
  function setupFormListeners() {
    setupUploadFormListener();
    setupLoginFormListener();
    setupRegisterFormListener();
  }



  function loadProfile() {
    if (!userId) {
      showLoginSection();
      return;
    }
    fetchProfileData();
  }

  function showLoginSection() {
    showSectionById('profile-content');
    id('login-section').style.display = 'none';
    id('user-info').style.display = 'block';
    id('purchase-history').style.display = 'block';
    id('user-listings').style.display = 'block';
  }

  function fetchProfileData() {
    fetch(`/account`, {
      headers: {
        'x-session-id': sessionId
      }
    })
    .then(checkStatus)
    .then(resp => resp.json())
    .then(displayProfile)
    .catch(handleError);
  }

  function displayProfile(profile) {
    id('email-display').textContent = `Email: ${profile.user.email}`;
    const userListingSection = id('user-listings').querySelector('.items-list');
    userListingSection.innerHTML = '';

    profile.listings.forEach(item => {
      const itemElement = createItemElement(item);
      itemElement.addEventListener('click', () => {
        fetchItemDetails(item.id);
      });
      userListingSection.appendChild(itemElement);
    });

    showSection('profile-content');
    id('login-section').style.display = 'none';
    id('user-info').style.display = 'block';
    id('purchase-history').style.display = 'block';
    id('user-listings').style.display = 'block';
  }

  function fetchItemDetails(itemId) {
    fetch(`/listing/item?id=${itemId}`)
      .then(checkStatus)
      .then(resp => resp.json())
      .then(showItemDetails)
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
      id('purchase-history').style.display = 'none';
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