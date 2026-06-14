<?php
// api/login.php
require_once "config.php";

$data = getJsonInput();
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// 1. Check Admin Credentials (can be moved to a DB table 'admins')
if ($email === 'admin@platform.com' && $password === 'admin') {
    echo json_encode([
        "token" => "mrt_admin_token_" . time(),
        "user" => [
            "id" => "admin",
            "name" => "Super Admin",
            "email" => $email,
            "role" => "ADMIN"
        ]
    ]);
    exit();
}

// 2. Check Client User from DB
$query = "SELECT u.*, c.companyName, c.clientId as clientInternalId 
          FROM users u 
          LEFT JOIN clients c ON u.clientId = c.id 
          WHERE u.email = :email AND u.password = :password";

$stmt = $db->prepare($query);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password', $password);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        "token" => "mrt_user_token_" . bin2hex(random_bytes(16)),
        "user" => [
            "id" => $row['id'],
            "name" => $row['name'],
            "email" => $row['email'],
            "role" => $row['role'],
            "clientId" => $row['clientId']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid credentials"]);
}
?>
