# Wi-Fi Hub

This project is a network scanning hub that allows users to access information about devices connected to the same Wi-Fi network. It retrieves details such as IP addresses, hostnames, and device statuses.

## Project Structure

```
wifi-hub
├── src
│   ├── app.py            # Entry point of the application
│   ├── network           # Module for network scanning functionalities
│   │   ├── __init__.py   # Initializer for the network module
│   │   ├── scanner.py     # Functions for scanning the local network
│   │   └── utils.py       # Utility functions for network operations
│   └── api               # Module for API routes
│       ├── __init__.py   # Initializer for the API module
│       └── routes.py      # API routes for the application
├── requirements.txt      # List of dependencies
└── README.md             # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd wifi-hub
   ```

2. **Install dependencies:**
   It is recommended to use a virtual environment. You can create one using:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
   Then install the required packages:
   ```
   pip install -r requirements.txt
   ```

3. **Run the application:**
   Start the Flask application by running:
   ```
   python src/app.py
   ```
   The application will be accessible at `http://localhost:5000`.

## Usage

To scan the network for connected devices, send a GET request to the `/scan` endpoint:
```
GET http://localhost:5000/scan
```
This will return a JSON response containing the hub's IP address, hostname, and a list of devices with their statuses.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.