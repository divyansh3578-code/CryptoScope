<?php
include 'db.php';
$first_name = $_POST['first_name'];
$last_name  = $_POST['last_name'];
$username   = $_POST['username'];
$email      = $_POST['email'];
$password   = $_POST['password'];
$confirm    = $_POST['confirm_password'];
// Password match check
if ($password !== $confirm) {
    header("Location:/CRYPTOSCOPE/frontend/Signup.html?success=registered");
    exit();
}
// Check existing user
$check = $conn->prepare("SELECT * FROM users WHERE email=? OR username=?");
$check->bind_param("ss", $email, $username);
$check->execute();
$result=$check->get_result();
if ($result->num_rows > 0) {
    header("Location: /CRYPTOSCOPE/frontend/Signup.html?success=registered");
    exit();
}
// Hash password
$hashedPassword = password_hash($password,PASSWORD_DEFAULT);
// Insert user
$stmt = $conn->prepare("INSERT INTO users (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $first_name, $last_name, $username, $email, $hashedPassword);
if ($stmt->execute()) {
   header("Location: /CRYPTOSCOPE/frontend/Signup.html?success=registered");
    exit();
} else {
   header("Location: /CRYPTOSCOPE/frontend/Signup.html?success=registered");
    exit();
}
?>