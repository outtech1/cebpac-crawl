/*
-------------------------------------------------------------------

Cebpac node.js Crawler
Works better if Cebpac cookies are already stored in the browser

How to use:

-Command Line: 
> npm install
> node app.js <Departure> <Arrival> <Depature Date> <Return Date(Optional)>

Ex.
> node app.js MNL MPH 2018-05-22 2018-05-30

Departure City format: MNL Airport Code
Arrival City format: CEB
Departure Date format: YYYY-MM-DD  Note: Middle of the Week
Return Date format: YYYY-MM-DD  Note: Middle of the Week

-------------------------------------------------------------------
*/

var Crawler = require("simplecrawler");
var cheerio = require("cheerio");

//Arguments
var departure = process.argv[2];
var arrival = process.argv[3];
var date1 = process.argv[4];
var date2 = process.argv[5];

//Defaults
if (!departure) {
	var departure = "MNL"; 
}

if (!arrival) {
	var arrival = "MPH"; 
}

if (!date1) {
	date1 = "2018-03-01";
}

if (!date2){
	var website = "https://beta.cebupacificair.com/Flight/InternalSelect?s=true&o1="+departure+"&d1="+arrival+"&dd1="+date1+"&mon=true";
} else {
	var website = "https://beta.cebupacificair.com/Flight/InternalSelect?s=true&o1="+departure+"&d1="+arrival+"&dd1="+date1+"&dd2="+date2+"&r=true&mon=true";
}

// https://beta.cebupacificair.com/Flight/InternalSelect?s=true&o1=MNL&d1=MPH&dd1=2018-05-29&dd2=2018-05-30&r=true&mon=true
// Original URL
// https://beta.cebupacificair.com/Flight/InternalSelect?s=true&o1="+departure+"&d1="+arrival+"&dd1="+date1+"&mon=true

// Other URL if above doesn't work
// https://beta.cebupacificair.com/Flight/Select?o1=MNL&d1=CEB&dd1=2018-1-16&ADT=1&CHD=0&INF=0&inl=0&pos=cebu.ph

var crawler = Crawler(website);

crawler.acceptCookies=true;

crawler.discoverResources = function(buffer, queueItem) {
    var $ = cheerio.load(buffer.toString("utf8"));

    var fareAmountArr=[];
    var fareAmountArrDepart=[];
    var fareAmountArrReturn=[];
    var fareDayArr=[];
    var fareDayArrDepart=[];
    var fareDayArrReturn=[];
    var fareMonthArr=[];
    var fareMonthArrDepart=[];
    var fareMonthArrReturn=[];
    var fareIndexsDepart =[];
    var fareIndexsReturn =[];

    var fareDay=$("p.day").map(function () {
    	fareDayArr.push($(this).text());
    });

    for(var i=0;i<fareDayArr.length;i++){
    	if(i<7){
    		fareDayArrDepart.push(fareDayArr[i]);
    	} else {
    		fareDayArrReturn.push(fareDayArr[i]);
    	}
    };

    var fareMonth=$("p.month").map(function () {
    	fareMonthArr.push($(this).text());
    });

    for(var i=0;i<fareMonthArr.length;i++){
    	if(i<7){
    		fareMonthArrDepart.push(fareMonthArr[i]);
    	} else {
    		fareMonthArrReturn.push(fareMonthArr[i]);
    	}
    };

    var fareAmount=$(".price.lowFareAmt").map(function () {
    	var parsedAmt = Number($(this).text().replace(/[^0-9\.-]+/g,""));
    	fareAmountArr.push(parsedAmt);	
    });

    for(var i=0;i<fareAmountArr.length;i++){
    	if(i<7){
    		fareAmountArrDepart.push(fareAmountArr[i]);
    	} else {
    		fareAmountArrReturn.push(fareAmountArr[i]);
    	}
    };

    var lowestAmountDepart = Math.min(...fareAmountArrDepart);

	fareAmountArrDepart.filter(function (elem, index, array){
		if(elem == lowestAmountDepart) {
        	fareIndexsDepart.push(index);
    	}
	});

	for(var i=0;i<fareIndexsDepart.length;i++){
		fareAmountArrDepart[fareIndexsDepart[i]]=lowestAmountDepart+" <- LOWEST FARE!!"
	}

    console.log("\x1b[47m\x1b[30mDeparture %s -> %s\x1b[0m",departure,arrival)

    for(var i=0;i<fareAmountArrDepart.length;i++){
    	console.log("Day: "+fareMonthArrDepart[i]+" "+fareDayArrDepart[i]+" Amount: \x1b[31m%s\x1b[0m",fareAmountArrDepart[i]);
    }

    if(fareAmountArrReturn){
    	var lowestAmountReturn = Math.min(...fareAmountArrReturn);

		fareAmountArrReturn.filter(function (elem, index, array){
			if(elem == lowestAmountReturn) {
        		fareIndexsReturn.push(index);
    		}
		});

		for(var i=0;i<fareIndexsReturn.length;i++){
			fareAmountArrReturn[fareIndexsReturn[i]]=lowestAmountReturn+" <- LOWEST FARE!!"
		}

		console.log("\n")
	    console.log("\x1b[47m\x1b[30mReturn %s -> %s\x1b[0m",arrival,departure)

	    for(var i=0;i<fareAmountArrReturn.length;i++){
	    	console.log("Day: "+fareMonthArrReturn[i]+" "+fareDayArrReturn[i]+" Amount: \x1b[31m%s\x1b[0m",fareAmountArrReturn[i]);
	    }
	}

    
};

/*crawler.on("fetchcomplete", function(queueItem, data, res)  {
    console.log(res);
    //console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
    //console.log("It was a resource of type %s", response.headers['content-type']);
});
*/
crawler.start();
