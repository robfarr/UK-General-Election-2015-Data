var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");


var BaseURL = "http://www.bbc.co.uk/news/politics/constituencies/";
var IndexURL = "http://www.bbc.co.uk/news/politics/constituencies";

var Constituencies = [];
var Candidates = [];


BuildIndexData(function(){

	var done = 0;
	for(var i=0; i<Constituencies.length; i++){
		LoadConstituencyData(Constituencies[i], function(){
			done++;
			if(done >= Constituencies.length){
				WriteCSV();
				WriteJSON();
			}
		});
	}

});



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
				Constituencies.push(id);
				console.log("OK! Indexed constituency " + id + " (" + $(this).text() + ")");
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
		var constituency = $(".constituency-title__title").text();

		$(".party").each(function(i, element){
			
			var candidate = {
				constituency: constituency,
				party: $(this).find(".party__name--long").text().replace(/('|")/g, ''),
				name: $(this).find(".party__result--candidate").text().replace(/('|")/g, ''),
				votes: $(this).find(".party__result--votes").text().replace(/,/g, ''),
				share: $(this).find(".party__result--votesshare").text(),
				change: $(this).find(".party__result--votesnet").text()
			}
			
			if(candidate['constituency'] !== "" && candidate['party'] !== "" && candidate['name'] !== "" && candidate['votes'] !== "" && candidate['share'] !== "" && candidate['change'] !== ""){
				Candidates.push(candidate);
				console.log("OK! Parsed candidate " + candidate.constituency + "\\" + candidate.name);
			}

		});

		if(typeof Callback == "function") Callback();

	});


}



function WriteCSV(){

	var stream = fs.createWriteStream("data.csv");
	stream.once("open", function(fd){

		stream.write("constituency,party,name,votes,share,change\n");

		for(var i=0, candidate; candidate = Candidates[i]; i++){

			stream.write(candidate.constituency + ",");
			stream.write(candidate.party + ",");
			stream.write(candidate.name + ",");
			stream.write(candidate.votes + ",");
			stream.write(candidate.share + ",");
			stream.write(candidate.change);

			if(i < Candidates.length-1){
				stream.write("\n");
			}

		}

		stream.end();

		console.log("Done! CSV file exported.");

	});

}


function WriteJSON(){
	fs.writeFile("data.json", JSON.stringify(Candidates, null, 4), function(err){
		if(!err){
			console.log("Done! JSON file exported.");
		}else{
			console.error("Error: Could not write data.json file, " + err);
		}
	});
}
