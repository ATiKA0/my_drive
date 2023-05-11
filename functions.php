<?php

$con = mysqli_connect('localhost', 'root', '', 'mydrive_db');

$icons = [
    'image/jpeg' => '<i class="bi bi-card-image class_39"></i>',
    'image/png' => '<i class="bi bi-card-image class_39"></i>'
];
function query($query)
{

    global $con;

    $result = mysqli_query($con, $query);
    if ($result) {
        if (!is_bool($result) && mysqli_num_rows($result) > 0) {
            $res = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $res[] = $row;
            }
            return $res;
        }
    }

    return false;
}

function get_date($date){
    return date("jS M Y", strtotime($date));
}