<?php
session_start();
include 'db.php';
$email = $_POST['email'];
$password = $_POST['password'];
// Check user by email
$stmt = $conn->prepare("SELECT * FROM users WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        // Redirect to dashboard
        header("Location: index.html");
exit();
    } else {
        echo "Incorrect password!";
    }
} else {
    echo "User not found!";
}
?>