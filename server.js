var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var sqlite3 = require("sqlite3").verbose();


var BaseURL = "http://www.bbc.co.uk/news/politics/constituencies/";
var IndexURL = "http://www.bbc.co.uk/news/politics/constituencies";

var Constituencies = [];
var Candidates = [];


if( fs.existsSync("data.sqlite") ){
	fs.unlinkSync("data.sqlite");
}

var db = new sqlite3.Database("data.sqlite");


CreateDatabase(BuildIndexData(function(){

	var done = 0;
	for(var i=0; i<Constituencies.length; i++){
		LoadConstituencyData(Constituencies[i], function(){
			done++;
			if(done >= Constituencies.length){
				
				WriteCSV();
				WriteJSON();

				console.log("Done! Data files have been created successfully.");

			}
		});
	}

}));


function CreateDatabase(Callback){
	db.run("PRAGMA foreign_keys = ON;");
	db.run("CREATE TABLE IF NOT EXISTS Constituency ( ONSID VARCHAR(9) PRIMARY KEY, Name VARCHAR(64) NOT NULL );");
	db.run("CREATE TABLE IF NOT EXISTS Party ( Name VARCHAR(64) PRIMARY KEY );")
	db.run("CREATE TABLE IF NOT EXISTS Candidate ( CandidateID INTEGER PRIMARY KEY AUTOINCREMENT, Name VARCHAR(64) NOT NULL, Constituency VARCHAR(9) NOT NULL, Party VARCHAR(64) NOT NULL, Votes INTEGER, Share INTEGER, Change INTEGER, FOREIGN KEY (Constituency) REFERENCES Constituency(ONSID) ON DELETE CASCADE, FOREIGN KEY (Party) REFERENCES Party(Name) ON DELETE CASCADE );");
	if(typeof Callback == "function") Callback();
}


function BuildIndexData(Callback){

	request(IndexURL, function(error, response, html){
		
		if(error){
			console.error("Error: Could not load index webpage. " + error);
			return null;
		}

		var $ = cheerio.load(html);

		$(".az-table__row").find("a").each(function(i, element){
			var url = $(this).attr("href");
			if(url.indexOf("/news/politics/constituencies/") == 0){
				
				var id = url.substr("/news/politics/constituencies/".length);
				var name = $(this).text();

				Constituencies.push(id);
				db.run("INSERT OR IGNORE INTO Constituency (ONSID, Name) VALUES (?, ?);", [id, name]);

				console.log("OK! Indexed constituency " + id + " (" + name + ")");

			}
		});

		if(typeof Callback == "function") Callback();

	});

}


function LoadConstituencyData(ConstituencyID, Callback){


	var requestURL = BaseURL + ConstituencyID;

	request(requestURL, function(error, response, html){
		
		if(error){
			console.error("Could not load constituency webpage " + ConstituencyID + ". " + error);
			return null;
		}

		var $ = cheerio.load(html);

		$(".off-screen").remove();
		var constituencyname = $(".constituency-title__title").text();

		$(".party").each(function(i, element){
			
			var candidate = {
				constituencyid: ConstituencyID,
				constituencyname: constituencyname,
				party: $(this).find(".party__name--long").text().replace(/('|")/g, ''),
				name: $(this).find(".party__result--candidate").text().replace(/('|")/g, ''),
				votes: $(this).find(".party__result--votes").text().replace(/,/g, ''),
				share: $(this).find(".party__result--votesshare").text(),
				change: $(this).find(".party__result--votesnet").text()
			}
			
			if(candidate['constituencyid'] !== "" && candidate['constituencyname'] !== "" && candidate['party'] !== "" && candidate['name'] !== "" && candidate['votes'] !== "" && candidate['share'] !== "" && candidate['change'] !== ""){
				
				Candidates.push(candidate);

				db.serialize(function(){
					db.run("INSERT OR IGNORE INTO Party (Name) VALUES (?);", candidate['party']);
					db.run("INSERT INTO Candidate (Name, Constituency, Party, Votes, Share, Change) VALUES (?, ?, ?, ?, ?, ?);", [candidate['name'], candidate['constituencyid'], candidate['party'], candidate['votes'], candidate['share'], candidate['change']]);
				});

				console.log("OK! Parsed candidate " + candidate.constituencyname + "\\" + candidate.name);

			}

		});

		if(typeof Callback == "function") Callback();

	});


}



function WriteCSV(){

	var stream = fs.createWriteStream("data.csv");
	stream.once("open", function(fd){

		stream.write("constituencyid,constituencyname,party,name,votes,share,change\n");

		for(var i=0, candidate; candidate = Candidates[i]; i++){

			stream.write("\"" + candidate.constituencyid + "\",");
			stream.write("\"" + candidate.constituencyname + "\",");
			stream.write("\"" + candidate.party + "\",");
			stream.write("\"" + candidate.name + "\",");
			stream.write("\"" + candidate.votes + "\",");
			stream.write("\"" + candidate.share + "\",");
			stream.write("\"" + candidate.change + "\"");

			if(i < Candidates.length-1){
				stream.write("\n");
			}

		}

		stream.end();

	});

}


function WriteJSON(){
	fs.writeFile("data.json", JSON.stringify(Candidates, null, 4), function(err){
		if(err) console.error("Error: Could not write data.json file, " + err);
	});
}
