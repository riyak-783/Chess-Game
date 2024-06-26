const express = require("express"); 
const socket = require("socket.io"); //socket need to be connected on both frontend and   backend sides.
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();

const server = http.createServer(app);
const io = socket(server); //socket use for real time communication

const chess = new Chess(); //chess js ka sara content is chess m agya h

let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Clone"});
});

io.on("connection", function(uniquesocket){
    console.log("connected");

 if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
 }  else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
 } else{
    uniquesocket.emit("spectatorRole");
 }

 uniquesocket.on("disconnect", function(){
   if (uniquesocket.id === players.white) {
      delete players.white;
   } else if (uniquesocket.id === players.black) {
      delete players.black;
 }
});

uniquesocket.on("move", (move) => {
   try{
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
         currentPlayer = chess.turn();
         io.emit("move", move);
         io.emit("boardState", chess.fen())   //fen gives the current state of the chess board location
      }      else {
         console.log("Invalid move : ", move);
         uniquesocket.emit("invalidMove", move);
      }                

   } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid move : ", move);
   }
});
});

server.listen(3000);