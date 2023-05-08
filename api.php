<?php
session_start();
require 'functions.php';

$info = [];
$info['succes'] = false;

if($_SERVER['REQUEST_METHOD'] == 'POST' && !empty($_POST['data_type'])){
    
    $info['data_type'] = $_POST['data_type'];

    if($_POST['data_type'] == 'upload_files'){
        $folder = 'uploads/';
        if(!file_exists($folder)){
            mkdir($folder, 0777,true);
            file_put_contents($folder.".htacces", "Options -Indexes");
        }
        foreach ($_FILES as $key => $file) {
            $destination = $folder.time().$file['name'];
            if(file_exists($destination))
                $destination = $folder.time().rand(0,9999).$file['name'];
            move_uploaded_file($file['tmp_name'],$destination);

            //save to database
            $type = $file['type'];
            $dateCreated = date('Y-m-d H:i:s');
            $dateUpdated = date('Y-m-d H:i:s');
            $fileName = $file['name'];
            $filePath = $destination;
            $user_id = 0;
            $fileSize = filesize($destination);

            $query = "INSERT INTO mydrive (file_name, file_size, file_path, user_id, file_type, date_created, date_updated) 
            values ('$fileName', '$fileSize', '$filePath', '$user_id', '$type', '$dateCreated', '$dateUpdated')";
            query($query);
            $info['succes'] = true;
        }
    }else
    if($_POST['data_type'] == 'get_files'){

            $query = "SELECT * FROM mydrive order by id desc limit 30";
            $rows = query($query);
            
            if($rows){
               $info['rows'] = $rows; 
               $info['succes'] = true; 
            }   
    }
}

echo json_encode($info);