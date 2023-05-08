<?php

$con = mysqli_connect('localhost', 'root', '', 'mydrive_db');
function query($query){
    
    global $con;

    $result = mysqli_query($con, $query);
    if($result){
        if(!is_bool($result) && mysqli_num_rows($result) > 0){
            $res = [];
            while($row = mysqli_fetch_assoc($result)){
                $res[] = $row;
            }
            return $res;
        }
    }

    return false;
}