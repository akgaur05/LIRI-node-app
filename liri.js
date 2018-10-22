require('dotenv').config()

//keys.js to get the keys from env
const keys    = require("./keys.js");

//spotify API to get the song
const Spotify = require("node-spotify-api");
const spotify = new Spotify(keys.spotify);

//request  for OMDB
var request = require("request");

//for date formatter
var moment = require('moment');

//for file system
const fs      = require("fs");

// Operating System (for end-of-line)
const os      = require("os");

//for user inputs
const i=2;
const option = process.argv[i];
const title  = process.argv.slice(i+1).join(" ");

//log file to save the user searches
const file_log = "log.txt";
if (!fs.existsSync(file_log)) {
    fs.writeFile(file_log, "", error => {
        if (error) {
            console.log(`Error in creating "${file_log}"\n${error}\n\n\n`);
            return;
        }
    });
}


//my main function to call the different APIs using switch cases
mainMenu(option,title);

function mainMenu(option,title){

    switch(option.toLowerCase()){
        case "spotify-this-song":
        getSong((title) ? title: "Hero"); //added a song incase user doesn't enter any song 
        break;

        case "movie-this":
        getMovie((title) ? title: "SANJU");//added a movie in case user doesn't enter any movie
        break;

        case "concert-this":
        getConcert((title) ? title: "U2");
        break;

        case "do-what-it-says":
        doWhatItSays();
        break;

        default:
        saveOutput(`Error:\n"${option}" is a not valid command.\nPlease select "spotify-this-song", "movie-this", "concert-this", or "do-what-it-says".\n\n\n`);

    }
}

function getSong(title) {
    const parameters = {
        "type" : "track",
        "query": title,
        "limit": 1
    };

    spotify.search(parameters, (error, data) => {
        if (error) {
            saveOutput(`Error in calling "Spotify"\n${error}\n\n\n`);
            return;
        }

        // For simplicity, we assume that Spotify always finds the right song
        const song = data.tracks.items[0];

        // Display all artists
        const artists = song.artists.map(a => a.name);

        let output = "Spotify This Song\n";
        
        output += addSeparator();
        
        output += `Artists      : ${artists.join(", ")}\n`;
        output += `Album        : ${song.album.name}\n`;
        output += `Track        : ${song.name}\n`;
        output += `Preview link : ${song.preview_url}\n\n`;
        
        output += addSeparator() + "\n";

        saveOutput(output);
    });
}

function getMovie(title){
    const omdbURL=`https://www.omdbapi.com/?apikey=${keys.omdb.id}&t=${title}&plot=short`;
    request(omdbURL, (error, response, body) => {
        if (error) {
            saveOutput(`Error in calling "OMDB"\n${error}\n\n\n`);
            return;
        }
        if (response.statusCode !== 200) {
            saveOutput(`Error in calling "OMDB"\n${response}\n\n\n`);
            return;
        }

        const movie = JSON.parse(body);
        let output = "Movie This\n";

        output += addSeparator();
        
        output += `Title          : ${movie.Title}\n`;
        output += `Release year   : ${movie.Year}\n`;
        output += `Plot           : ${movie.Plot}\n`;
        output += `Actors         : ${movie.Actors}\n`;
        output += `IMDB           : ${movie.imdbRating}\n`;
        output += `RottenTomatoes : ${(movie.Ratings[1]) ? movie.Ratings[1].Value : "N/A"}\n`;
        output += `Production     : ${movie.Country}\n`;
        output += `Language       : ${movie.Language}\n\n`;
        
        output += addSeparator() + "\n";

        saveOutput(output);
    });
}

function getConcert(title){

    const bandsInTownURL=`https://rest.bandsintown.com/artists/${title}/events?app_id=${keys.bandsInTown.key}`;
    request(bandsInTownURL, (error, response, body) => {
        if (error) {
            saveOutput(`Error in calling "Bands In Town"\n${error}\n\n\n`);
            return;
        }
        if (response.statusCode !== 200) {
            saveOutput(`Error in calling "Bands In Town"\n${response}\n\n\n`);
            return;
        }

        const concert = JSON.parse(body);
        
        for(let i=0;i<1;i++){
            let output = "Concert This\n";
            //Converting date using moment.js
            const concertDate=`${concert[i].datetime}`;
            const dateOfEvent=moment(concertDate).format("MM-DD-YYYY");

            output += addSeparator();
            output += `Title           : ${concert[i].lineup}\n`;
            output += `Name of Venue   : ${concert[i].venue.name}\n`;
            output += `Venue Location  : ${concert[i].venue.city},${concert[i].venue.country}\n`;
            output += `Date of Event   : ${dateOfEvent}\n\n`;
            output += addSeparator() + "\n";
            saveOutput(output);
        }
        });
        
}

function doWhatItSays() {
    fs.readFile("random.txt", "utf8", (error, data) => {
        if (error) {
            saveOutput(`Error in calling "Do What It Says":\n${error}\n\n\n`);
            return;
        }

        // Use require("os").EOL to split into lines, independent of the platform
        const commands = data.split(os.EOL);
        
        if (commands.length === 1 && commands[0] === "") {
            saveOutput(`Error in calling "Do What It Says":\nPlease enter a command in "random.txt".\n\n\n`);
        }

        commands.forEach(c => {
            if (c === "") {
                return;
            }

            // Use indexOf instead of split, in case the title has a comma
            const index = c.indexOf(",");
            //incase error in reading any file detail,set default to read a movie
            const option = (index >= 0) ? c.substring(0,  index).trim().toLowerCase() : "movie-this";
            const title  = (index >= 0) ? c.substring(index + 1).trim()               : "Sanju";
            mainMenu(option, title);
        });
    });
}



function addSeparator() {
    return "*".repeat(60) + "\n\n";
}

function saveOutput(output) {
    // Write to the terminal
    console.log(output);

    // Write to the log file
    fs.appendFile(file_log, output, error => {
        if (error) {
            return console.log(`Error in appending to "${file_log}"\n${error}\n\n\n`);
        }
    });
}