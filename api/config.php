<?php
// api/config.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials
$host = "localhost";
$db_name = "your_mrt_database";
$username = "your_mrt_user";
$password = "your_mrt_password";

try {
    $db = new PDO("mysql:host=" . $host . ";dbname=" . $db_name, $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    echo json_encode(["error" => "Connection error: " . $exception->getMessage()]);
    exit();
}

// Helper: Get JSON input
function getJsonInput() {
    return json_decode(file_get_contents("php://input"), true);
}

// Helper: Verify simple token (Simplified for PHP hosting)
function authenticate() {
    $headers = apache_request_headers();
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit();
    }
    // Logic to verify token would go here
    return true;
}
?>
