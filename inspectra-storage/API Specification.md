# API Documentation for File Upload and Management

This API allows users to upload, list, and delete files. Files are stored in a directory specific to each user based on their `userid` stored in a cookie.

## Base URL
```http://localhost:3001```


## API Endpoints

---

### **1. Upload Files**

- **Endpoint**: `/upload`
- **Method**: `POST`
- **Description**: Allows users to upload one or more files. The files are saved to a directory specific to the user's ID, which is stored in a cookie.
- **Request Body**:
  - `photos` (multipart/form-data): The files to be uploaded. Up to 50 files are allowed.
  - The `Content-Type` header should be `multipart/form-data`.

- **Response**:
  - **200 OK**: Successfully uploaded files.
    ```json
    {
      "message": "Files uploaded successfully!",
      "files": [
        {
          "filename": "1617818400000-image1.jpg",
          "path": "/uploads/12345/1617818400000-image1.jpg"
        },
        {
          "filename": "1617818400001-image2.jpg",
          "path": "/uploads/12345/1617818400001-image2.jpg"
        }
      ]
    }
    ```
  - **400 Bad Request**: No files uploaded.
    ```json
    {
      "message": "No files uploaded"
    }
    ```
  - **500 Internal Server Error**: An error occurred during file upload.
    ```json
    {
      "message": "Error uploading files"
    }
    ```

---

### **2. List User Files**

- **Endpoint**: `/user-files`
- **Method**: `GET`
- **Description**: Retrieves a list of all files uploaded by the current user. The server identifies the user by the `userid` cookie.
- **Request Headers**:
  - `Cookie: userid=<USER_ID>`
  
- **Response**:
  - **200 OK**: Successfully retrieved list of user files.
    ```json
    {
      "files": [
        {
          "filename": "1617818400000-image1.jpg",
          "path": "/uploads/12345/1617818400000-image1.jpg"
        },
        {
          "filename": "1617818400001-image2.jpg",
          "path": "/uploads/12345/1617818400001-image2.jpg"
        }
      ]
    }
    ```
  - **400 Bad Request**: Missing or invalid `userid` cookie.
    ```json
    {
      "message": "User ID not found"
    }
    ```
  - **404 Not Found**: No files found for the user.
    ```json
    {
      "message": "No files found for this user"
    }
    ```
  - **500 Internal Server Error**: Error reading files from the server.
    ```json
    {
      "message": "Error reading the directory"
    }
    ```

---

### **3. Delete File**

- **Endpoint**: `/delete-file`
- **Method**: `DELETE`
- **Description**: Deletes a specific file uploaded by the user. The user must provide the `filename` of the file to be deleted.
- **Request Body** (JSON):
  - `filename` (string): The name of the file to be deleted.
  
- **Request Headers**:
  - `Cookie: userid=<USER_ID>`
  
- **Response**:
  - **200 OK**: File deleted successfully.
    ```json
    {
      "message": "File deleted successfully"
    }
    ```
  - **400 Bad Request**: Missing `filename` or `userid`.
    ```json
    {
      "message": "Missing userId or filename"
    }
    ```
  - **404 Not Found**: The file does not exist.
    ```json
    {
      "message": "File not found"
    }
    ```
  - **500 Internal Server Error**: Error deleting the file.
    ```json
    {
      "message": "Error deleting file"
    }
    ```

---

## Authentication / Authorization

- **User Identification**: The server uses cookies to store the `userid` which is required to upload and delete files. Ensure the cookie is set and sent with each request to authenticate the user.

---

## File Storage Information

- **Location**: Files are stored on the local server in a folder named `uploads`, organized by user ID. Each user's files are stored in their specific directory (e.g., `/uploads/<USER_ID>`).
  
- **File Size Limit**: Each file uploaded is limited to 5 MB. The server rejects larger files.

- **File Naming Convention**: Uploaded files are renamed using a timestamp followed by the original filename (e.g., `1617818400000-image1.jpg`) to avoid filename conflicts.

---

## Error Handling

The API responds with appropriate HTTP status codes and a message in the JSON response body for different error scenarios. Below are some possible errors and their responses:

- **400 Bad Request**: Occurs if required fields are missing or invalid (e.g., `userid`, `filename`).
- **404 Not Found**: Occurs if the file or the user’s directory cannot be found.
- **500 Internal Server Error**: Occurs if there’s a server issue while processing the request.
