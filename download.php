<?php

/*
File download
*/

session_start();
require 'functions.php';

//get the item id and the user id
$id =       $_GET['id'] ?? null;
$user_id =  $_SESSION['USER']['id'] ?? 0;

$id = (int)$id;
$user_id = (int)$user_id;

//create and run the query for the file
$query = "SELECT * FROM mydrive WHERE id = '$id' LIMIT 1";
$row = query_row($query);

//if the file exist read it
if ($row) {
    if (check_file_access($row)) {
        $file_path = $row['file_path'];
        $file_name = $row['file_name'];

        header('Content-Disposition: attachment; filename = ' . basename($file_name) . '');
        readfile($file_path);
        exit();
    } else {
        echo "You don't have access to that file!";
    }
} else {
    echo "File not found!";
}
