<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "cryptoscope";
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_errno) {
    die("Database connection failed: " . $conn->connect_error);
}
?>