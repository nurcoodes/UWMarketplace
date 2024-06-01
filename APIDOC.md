# Husky API API Documentation
*This API contains several example post that users will be able to interact with. Users can add to
this API by uploading an item of their own.*

## Get Category
**Request Format:** `/marketplace`

**Request Type:** `GET`

**Returned Data Format:** JSON

**Description:** Allows user to filter through items based on the category of the item.

**Example Request:**
`GET /marketplace`
`GET /marketplace?categories=electronics`

**Example Response:**

```
[
  {
    "id": "123",
    "name": "Smartphone",
    "category": "electronics",
    "price": 299.99,
    "description": "A high-end smartphone with a great camera.",
    "contact": "seller@example.com"
  },
  {
    "id": "124",
    "name": "Laptop",
    "category": "electronics",
    "price": 899.99,
    "description": "A powerful laptop for all your computing needs.",
    "contact": "seller2@example.com"
  }
]
```

**Error Handling:**
`400 Bad Request`: If no items are found for the specified category.
`500 Internal Server Error`: If there's an internal server error.


## Upload
**Request Format:** `/upload/item`

**Request Type:** `POST`

**Returned Data Format:** JSON

**Description:** Users will be able to add to this API by uploading their own items. These items
will be uploaded to the marketplace and also be saved in their account history. Users must be
logged in to upload an item.

**Example Request:** `POST /upload/item`
```
Headers: { "x-auth-token": "your_jwt_token_here" }
Body:
{
  "name": "Gaming Chair",
  "category": "furniture",
  "price": 199.99,
  "description": "Ergonomic gaming chair with lumbar support.",
  "contact": "gamer@example.com"
}
```
**Example Response:**
```
{
  "message": "Item successfully uploaded.",
  "itemId": "125"
}
```

**Error Handling:**
`400 Bad Request`: If any of the fields "name", "category", "price", "description", or "contact" are
missing in the request body.
`500 Internal Server Error`: If there's an internal server error.


## Listing
**Request Format:** `/listing/item`

**Request Type:** `GET`

**Returned Data Format**: Plain Text

**Description:** when a user clickes on a listing they will get the information about the item such
as the price, trading availibility, contact information etc..

**Example Request:** `GET /listing/item?id=123`

**Example Response:**

```
{
  "id": "123",
  "name": "Smartphone",
  "category": "electronics",
  "price": 299.99,
  "description": "A high-end smartphone with a great camera.",
  "contact": "seller@example.com",
  "available": true,
  "tradeOptions": ["Cash", "Bank Transfer"]
}
```

**Error Handling:**
`400 Bad Request`: If the required query parameters are missing.
`404 Not Found`: If no matching item is found for the provided ID.
`500 Internal Server Error`: If there's an internal server error.

## Logging in
**Request Format:** `/userauth`

**Request Type:** `POST`

**Returned Data Format**: Plain Text

**Description:**  Authenticates a user with their email and password. If successful, returns a JWT
 token for the session.

**Example Request:**
`POST /userauth`
{
  "email": "student@example.com",
  "password": "password123"
}

**Example Response:**
```
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "user": {
    "id": "1234567890",
    "name": "John Doe",
    "email": "student@example.com"
  }
}
```

**Error Handling:**
`400 Bad Request`: If email or password is missing.
`401 Unauthorized`: If authentication fails (wrong email or password).
`500 Internal Server Error`: If there's an internal server error.

## Transaction
**Request Format:** `/transaction`

**Request Type:** `POST`

**Returned Data Format**: JSON

**Description:**  Records a transaction between a buyer and a seller. This could include purchase
details and any additional notes about the transaction.

**Example Request:**
`POST /transaction`
Headers: { "x-auth-token": "your_jwt_token_here" }
Body:
{
  "buyerId": "buyer123",
  "sellerId": "seller456",
  "itemId": "item789",
  "price": 299.99,
  "transactionType": "Cash",
  "notes": "Item picked up from dorm."
}

**Example Response:**
```
{
  "message": "Transaction recorded successfully.",
  "transactionId": "tx123"
}
```

**Error Handling:**
`400 Bad Reques`t: If any of the fields "buyerId", "sellerId", "itemId", "price", or
 "transactionType" are missing in the request body.
`500 Internal Server Error`: If there's an internal server error.


## Account
**Request Format:** `/account`

**Request Type:** `GET`

**Returned Data Format**: JSON

**Description:** If the user is logged in, it will take them to the account page. Here the user can
see their account history such as purchases and listings

**Example Request:**
`GET /account?userId=1234567890`

**Example Response:**
```
{
  "user": {
    "id": "1234567890",
    "name": "John Doe",
    "email": "student@example.com",
    "listings": [
      {
        "id": "item789",
        "name": "Smartphone",
        "category": "electronics",
        "price": 299.99,
        "description": "A high-end smartphone with a great camera.",
        "contact": "student@example.com"
      }
    ],
    "purchases": [
      {
        "id": "item123",
        "name": "Laptop",
        "category": "electronics",
        "price": 899.99,
        "description": "A powerful laptop for all your computing needs.",
        "contact": "seller2@example.com"
      }
    ]
  }
}
```

**Error Handling:**
`400 Bad Request`: If the "userId" query parameter is missing.
`401 Unauthorized`: If the user is not authenticated.
`500 Internal Server Error`: If there's an internal server error.