# Husky API API Documentation
*This API contains several example post that users will be able to interact with. Users can add to
this API by uploading an item of their own.*

## Get Category
**Request Format:** `/MarketPlace?categories=all`

**Request Type:** `GET`

**Returned Data Format:** JSON

**Description:** Allows user to filter through items based on the category of the item.

**Example Request:** `GET /MarketPlace?categories=electronics`

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
`404 Not Found`: If no items are found for the specified category.


## Upload post
**Request Format:** `/upload/item`

**Request Type:** `POST`

**Returned Data Format:** JSON

**Description:** Users will be able to add to this API by uplaoding their own items. These items
will be uploaded to the market place and also be saved in their account history.

**Example Request:** `POST /upload/item`
```
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



## Listing
**Request Format:** `/listing/item`

**Request Type:** `GET`

**Returned Data Format**: JSON

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