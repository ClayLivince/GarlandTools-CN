<?php

use Ds\Queue;

require "api/common.php";

gtMappy();

$upLoadList = new Queue();

function gtMappy(){
    $ticket = $_GET["ticket"];
    if (! $ticket){
        return gtUpload();
    }
    return gtQuery();
}

function gtUpload(){

}

function gtQuery(){

}