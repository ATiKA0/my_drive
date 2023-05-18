<?php

/*
File download
*/

session_start();
require 'functions.php';

//check logged in
if (!isLoggedIn()) {
    echo "Please log in to download files!";
    die;
}

//get the item id and the user id
$id =       (int)$_GET['id'] ?? null;
$user_id =  (int)$_SESSION['USER']['id'];

//create and run the query for the file
$query = "SELECT * FROM mydrive WHERE user_id = '$user_id' && id = '$id' LIMIT 1";
$row = query($query);

//if the file exist read it
if ($row) {
    $row = $row[0];
    $file_path = $row['file_path'];
    $file_name = $row['file_name'];

    header('Content-Disposition: attachment; filename = ' . basename($file_name) . '');
    readfile($file_path);
    exit();
} else {
    echo "File not found!";
}
