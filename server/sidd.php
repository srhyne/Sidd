<?php
	//get class and config
	require_once "sidd.class.php";
	require_once "config.php";
	
	//sidd class 
	$Sidd = new Sidd($C['URL']);
	
	//get action
	$action = $_REQUEST['action'];
	
	$Sidd -> {$action}();
	

