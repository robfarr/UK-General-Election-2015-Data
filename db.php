<?php

	if( file_exists("data.sqlite") ){
		unlink("data.sqlite");
	}
	

	$db = new PDO("sqlite:data.sqlite") or die("Error: Could not connect to database.");
	$db->exec("CREATE TABLE Candidate (Constituency VARCHAR(64), Party VARCHAR(64), Name VARCHAR(64), Votes INTEGER, Share INTEGER, Change INTEGER)");


	$candidates = json_decode( file_get_contents("data.json") );
	foreach($candidates as $candidate){

		echo "Processing " . $candidate->name . "\n";

		$query = $db->prepare("INSERT INTO Candidate (Constituency, Party, Name, Votes, Share, Change) VALUES (:constituency, :party, :name, :votes, :share, :change)");
		$query->execute(array(
			":constituency" => $candidate->constituency,
			":party" => $candidate->party,
			":name" => $candidate->name,
			":votes" => intval($candidate->votes),
			":share" => intval($candidate->share),
			":change" => intval($candidate->change)
		));

	}
